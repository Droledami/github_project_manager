const express = require("express");
const {Octokit} = require("octokit");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const saltRounds = 10;
const PORT = 8080;

const tokenDuration = 30 * 60000; //30 minutes
const tokenRefreshDuration = tokenDuration * 2;
const tokenSize = 48;

const app = express();

app.use(cors());
app.use(express.static("../build"));
app.use(bodyParser.json());

app.post('/login', async (req, res) => {
    try {
        const {username, password} = req.body;
        //Compare credentials with database content, returns user id
        try {
            const teacher = await authenticateCredentials(username, password);
            const teacherId = teacher.teacherId;
            //get token and refresh token
            const tokens = await addToken(teacherId);
            //send object with token, refresh_token and userId
            res.send({teacher_id: teacherId, ...tokens});
        } catch (e) {
            res.sendStatus(500);
        }
    } catch (e) {
        console.error(e)
        res.sendStatus(500).json({userid: undefined, token: undefined, tokenRefresh: undefined});
    }
});

app.post('/me', async (req, res) => {
    //expected body structure: {teacher_id, token, refresh_token}
    const {teacher_id, token, refresh_token} = req.body;
    try {
        const isAuthorized = await authorisationCheck(teacher_id, token, refresh_token);
        if (isAuthorized === true) {
            res.sendStatus(200);//OK
        } else if (isAuthorized.token) {
            const tokens = isAuthorized;
            console.log(isAuthorized);
            res.status(201).send({teacher_id: teacher_id, ...tokens});//Ok with data renewal
        } else {
            res.sendStatus(401);//Unauthorized
        }
    } catch (e) {
        res.sendStatus(500);//Internal server error
    }
});

/**
 * Returns new tokens if they can be refreshed. Otherwise, returns true if the authentication is valid or false if invalid.
 */
async function authorisationCheck(teacher_id, token, refresh_token) {
    try {
        const isAuthorized = await checkTokenValidity(teacher_id, token);
        if (isAuthorized) {
            return true;
        } else {
            const canRefresh = await checkRefreshTokenValidity(teacher_id, refresh_token);
            if (canRefresh) {
                return await addToken(teacher_id);
            } else {
                return false;
            }
        }
    } catch (e) {
        console.log("Error while trying to validate identity: request format might be unexpected");
        throw e;
    }
}

app.get('/projects', async (req, res) => {
    try {
        const projects = await getAllProjects();
        res.status(200).send(projects);
    } catch (e) {
        res.status(500).send("Could not load projects");
    }
});

app.get('/project', async (req, res) => {
    const projectFetchingMethod = getProjectFetchingMethod(req.query);
    let projectIdentifier;
    try {
        let project;
        switch (projectFetchingMethod) {
            case "id":
                projectIdentifier = req.query.id;
                project = await getProjectWithId(projectIdentifier);
                break;
            case "url":
                projectIdentifier = req.query.url;
                project = await getProjectWithUrl(projectIdentifier);
                break;
            default:
                throw Error("Unknown fetching method");
        }
        res.status(200).send(project);
    } catch (e) {
        res.send(500).send(`Could not load project of ${projectFetchingMethod} ${projectIdentifier}`);
    }
});

function getProjectFetchingMethod(queryObject) {
    if (queryObject.id) {
        return "id";
    }
    if (queryObject.url) {
        return "url";
    }
}

app.post('/project', async (req, res) => {
    console.log("tentative d'ajout de projet reçue:")
    console.log(req.body);
    const tokens = req.body.tokens;
    const projectToAdd = req.body.project_data;
    const isAuthorised = await authorisationCheck(tokens.teacher_id, tokens.token, tokens.refresh_token);
    if (!isAuthorised) {
        res.sendStatus(401); //Unauthorised
        return;
    }
    const organizationExists = await checkIfOrganizationExists(projectToAdd.organization);
    if (!organizationExists) {
        res.sendStatus(406); //Not acceptable
        return;
    }
    try {
        const url = await uniqueUrl();
        await addProject(
            projectToAdd.name, projectToAdd.description, projectToAdd.organization, parseInt(projectToAdd.collaborators_min),
            parseInt(projectToAdd.collaborators_max), projectToAdd.group_tag, url, parseInt(tokens.teacher_id));
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.put('/project', async (req, res) => {
    console.log("tentative de modification de projet reçue:")
    console.log(req.body);
    const tokens = req.body.tokens;
    const isAuthorised = await authorisationCheck(tokens.teacher_id, tokens.token, tokens.refresh_token);
    const newProjectData = req.body.project_data;
    if (!isAuthorised) {
        res.sendStatus(401);
        return;
    }
    const organizationExists = await checkIfOrganizationExists(newProjectData.organization);
    if (!organizationExists) {
        res.sendStatus(406); //Not acceptable
        return;
    }
    try {
        await editProject(newProjectData.name, newProjectData.description, newProjectData.organization, newProjectData.collaborators_min,
            newProjectData.collaborators_max, newProjectData.group_tag, newProjectData.project_id);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.delete('/project', async (req, res) => {
    console.log("tentative de suppression de projet reçue:")
    console.log(req.body);
    const tokens = req.body.tokens;
    const isAuthorised = await authorisationCheck(tokens.teacher_id, tokens.token, tokens.refresh_token);
    if (!isAuthorised) {
        res.sendStatus(401);
        return;
    }
    const projectIdToDelete = req.body.project_id;
    try {
        const response = await deleteProject(projectIdToDelete);
        console.log(response);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/githubdata", async (req, res) => {
    //format of a member to send {git_hub_username:Jodo, first_name:John, surname:Doe, avatar_url: "https://test/image/jiosef"}
    console.log("Demande des données d'utilisateurs github");
    console.log(req.query.username);

    try {
        const response = await getGithubUser(req.query.username);
        const userData = response.data;
        console.log(userData);
        res.send({
            git_hub_username: userData.login,
            name: userData.name,
            avatar_url: userData.avatar_url,
            bio: userData.bio
        });
    } catch (e) {
        res.sendStatus(404);
    }
});

app.post("/teacher", async (req, res)=>{
    console.log("Tentative d'ajout de professeur reçue");
    const {username, password, git_token, first_name, surname} = req.body;
    try{
        await addTeacher(username, password, git_token, first_name, surname);
        const message = `Professeur ${first_name ? first_name + " " : ""} ${surname ? surname + " " : ""}au nom d'utilisateur "${username}" ajouté.`;
        console.log(message);
        res.status(200).send(message);
    }catch (e) {
        const message = `Erreur lors de l'ajout d'un professeur: ${e}`;
        console.log(message);
        res.status(500).send(message);
    }
});

app.post("/repository", async (req, res) => {
    console.log("Tentative d'ajout de repository");
    const gitHubUsers = req.body; //array
    const {url} = req.query;

    const project = await getProjectWithUrl(url);
    const projectCreatorGitToken = await getTeacherGitTokenById(project.TeacherId);

    const fetchRepos = await getReposFromOrg(project.Organization, projectCreatorGitToken);
    const orgRepos = fetchRepos.data;

    //Check if there is still room for another repository in the user's plan
    let canCreate
    try {
        console.log("Checking if plan still allows repository creation...");
        canCreate = await canCreateRepo(project.Organization, projectCreatorGitToken);
    } catch (e) {
        res.status(500).send({error: e});
        return;
    }
    if (!canCreate) {
        res.status(403).send({error: "Organization plan doesn't allow any more repositories"}); //Forbidden
        return;
    }

    //Create the next iteration of the repository name
    let repositoryName;
    try {
        repositoryName = createRepositoryName(project.TaggedGroup, orgRepos.length + 1);
    } catch (e) {
        res.status(500).send({error: e});
    }

    //check if member data was not altered when sent back to this API
    const areMembersVerified = await verifyRepositoryMembers(gitHubUsers);
    if (!areMembersVerified) {
        res.status(400).send({reason: "unverified", error: "Members' identity was altered."});
        return;
    }

    //Check if a member is not already part of another repository in the organization
    for (const gitHubUser of gitHubUsers) {
        console.log(`Checking if ${gitHubUser.git_hub_username} isn't already part of a repository in the organization...`);
        const isAlreadyPartOfAGroup = await checkIfCollaboratorIsPartOfAGroup(project.Organization, orgRepos, projectCreatorGitToken, gitHubUser.git_hub_username);
        if (isAlreadyPartOfAGroup) {
            const message = `Erreur: ${gitHubUser.git_hub_username} fait déjà partie d'un groupe dans l'organisation ${project.Organization}`;
            console.log(message);
            res.status(400).send({reason: "duplicate", error: message, duplicate_member: gitHubUser.git_hub_username});
            return;
        }
    }

    //Create the repository
    let response = await createRepository(project.Organization, repositoryName, projectCreatorGitToken);
    console.log(`Creating repository ${repositoryName}...`);
    if (response.status !== 201) {
        res.status(400).send({
            reason: "repository_creation_failed",
            error: `La création du repository ${repositoryName} a échoué.`
        });
        return;
    }

    //Add the members to the repository (role is "maintain" by default)
    for (const gitHubUser of gitHubUsers) {
        console.log(`Adding GitHub user ${gitHubUser.git_hub_username}...`);
        response = await addCollaboratorToRepository(project.Organization, repositoryName, gitHubUser.git_hub_username, projectCreatorGitToken);
        if (response.status !== 201 && response.status !== 204) {
            res.status(400).send({
                reason: "member_not_added",
                error: `La création du repository ${repositoryName} a été effectuée mais au moins un membre n'a pas pu être ajouté. Contactez votre professeur.`
            });
            return;
        }
    }

    res.status(201).send({message: `Sucessfully created repository ${repositoryName}`, repository_name: repositoryName})
});

function createRepositoryName(taggedGroup, repositoryNumber) {
    const regex = /.*\[(X+)].*/
    const parts = taggedGroup.match(regex);
    const numberOfX = parts[1].length;
    const repositoryNumberOfDigits = `${repositoryNumber}`.length;
    const numberOfZeros = numberOfX - repositoryNumberOfDigits;
    if (numberOfZeros < 0) {
        throw Error(`group Number overflowed. Max: ${numberOfX}`);
    }
    let numberStr = ""
    for (let i = 0; i < numberOfZeros; i++) {
        numberStr += "0";
    }
    numberStr += `${repositoryNumber}`;
    return taggedGroup.replace(`[${parts[1]}]`, numberStr);
}

async function checkIfCollaboratorIsPartOfAGroup(organization, orgRepos, projectCreatorGitToken, gitHubUserToCheck) {
    try {
        for (const orgRepo of orgRepos) {
            const response = await checkIfUserIsARepositoryCollaborator(orgRepo.owner.login, orgRepo.name, gitHubUserToCheck, projectCreatorGitToken);
            if (response.status === 204) return true;
        }
    } catch (e) {
        if (e.status === 404) {
            return false;
        }
    }
    return false;
}

async function verifyRepositoryMembers(gitHubUsers) {
    console.log("Verifying members...");
    try {
        for (const gitHubUser of gitHubUsers) {
            console.log(`Verifying ${gitHubUser.git_hub_username}...`)
            await getGithubUser(gitHubUser.git_hub_username);
        }
        return true;
    } catch (e) {
        if (e.status === 404) {
            console.log("Couldn't find member");
            console.log("GitHub members couldn't all be verified when creating a repository");
            return false;
        }
        console.log("Unexpected error")
        console.log(e);
    }
}

//DATABASE
let database = new sqlite3.Database("./database/gestion_projet_github.db", (err) => {
    if (err) {
        console.log(`Error opening database: ${err}`);
    } else {
        console.log("Database opened");
    }
});

function getAllProjects() {
    return new Promise((resolve, reject) => {
        const sqlGetAllProjects = `SELECT * FROM Project;`;
        database.all(sqlGetAllProjects, (err, rows) => {
            if (err) reject(`Error getting projects from the database: ${err}`);
            if (rows.length <= 0) reject(`Error getting projects from the database: table is empty`);
            resolve(rows);
        });
    });
}

function getProjectWithUrl(projectUrl) {
    return new Promise((resolve, reject) => {
        const sqlGetProjectWithUrl = `SELECT * FROM Project WHERE Url = ?;`;
        database.get(sqlGetProjectWithUrl, projectUrl, (err, row) => {
            if (err) reject(err);
            if (!row) reject(`no rows`);
            resolve(row);
        })
    });
}

function getProjectWithId(projectId) {
    return new Promise((resolve, reject) => {
        const sqlGetProjectWithId = `SELECT * FROM Project WHERE ProjectId = ?;`;
        database.get(sqlGetProjectWithId, projectId, (err, row) => {
            if (err) reject(`Error getting project with id ${projectId} from the database: ${err}`);
            if (!row) reject(`Error getting project from the database: no rows found for id ${projectId}`);
            resolve(row);
        });
    });
}

function authenticateCredentials(teacherUsername, password) {
    const sqlSelectUser = `SELECT TeacherId, PasswordHash, GitToken FROM Teacher WHERE Username = ?`;
    return new Promise((resolve, reject) => {
        database.get(sqlSelectUser, teacherUsername, (err, row) => {
            if (err)
                reject(`Database error in authentication attempt: ${err}`)
            if (!row) {
                reject(`Could not authenticate user: User does not exist`);
            } else {
                const teacherId = row.TeacherId;
                const gitToken = row.GitToken;
                const passwordHash = row.PasswordHash;
                bcrypt.compare(password, passwordHash, (err, result) => {
                    if (err) reject("Error checking hash");
                    result ? resolve({teacherId, gitToken})
                        : reject("Could not authenticate user : password is incorrect");
                });
            }
        })
    })
}

function addProject(projectName, description, organization,
                    minCollaborators, maxCollaborators, taggedGroup, url, teacherId) {
    const sqlAddProject = `INSERT INTO Project(
                            Name, Description, DateOfCreation, Organization,
                            MinCollaborators, MaxCollaborators, TaggedGroup,
                            Url, TeacherId) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?
                            );`;
    return new Promise((resolve, reject) => {
        database.run(sqlAddProject,
            [projectName, description, Date.now().toString(), organization,
                minCollaborators, maxCollaborators, taggedGroup, url, teacherId],
            (err) => {
                err ? reject(err)
                    : resolve(`Project ${projectName} added`);
            })
    });
}

function editProject(projectName, description, organization,
                     minCollaborators, maxCollaborators, taggedGroup, projectId) {
    const sqlEditProject = `UPDATE Project SET
                            Name = ?, Description = ?, Organization = ?,
                            MinCollaborators = ?, MaxCollaborators = ?, TaggedGroup = ?
                            WHERE ProjectId = ?;`;

    return new Promise((resolve, reject) => {
        database.run(sqlEditProject,
            [projectName, description, organization,
                minCollaborators, maxCollaborators, taggedGroup, projectId],
            (err) => {
                err ? reject(err)
                    : resolve(`Project ${projectName} edited`);
            })
    });
}

function deleteProject(projectId) {
    const sqlDeleteProject = `DELETE FROM Project WHERE ProjectId = ?;`;

    return new Promise((resolve, reject) => {
        database.run(sqlDeleteProject, projectId, (err) => {
            if (err) reject(err);
            resolve(`Project with id ${projectId} was deleted`);
        });
    });
}

function addTeacher(teacherUsername, password, gitToken, teacherFirstName, teacherSurname) {
    return new Promise(async (resolve, reject) => {
        if (!teacherUsername || !password || !gitToken) {
            const message = "Invalid teacher data, please provide at least a username, password and git token";
            console.log(message);
            reject(message);
            return;
        }
        if (!gitToken.startsWith("ghp_")) {
            const message = `${gitToken} does not look like a GitHub token.`;
            console.log(message);
            reject(message);
            return;
        }
        const hashedPassword = await hashPassword(password);
        const sqlInsertTeacher = `INSERT INTO Teacher(
                        Username, PasswordHash, GitToken, Name, Surname
                        ) VALUES (
                        ?, ?, ?, ?, ?
                        );`;
        database.run(sqlInsertTeacher, [teacherUsername, hashedPassword, gitToken, teacherFirstName, teacherSurname],
            (err) => {
                err ? reject(err)
                    : resolve(`Teacher ${teacherUsername} added`);
            })
    });
}

function getTeacherGitTokenById(teacherId) {
    const sqlSelectGitTokenByTeacherId = `SELECT GitToken FROM Teacher WHERE TeacherId = ?;`;
    return new Promise((resolve, reject) => {
        database.get(sqlSelectGitTokenByTeacherId, teacherId, (err, row) => {
            err ? reject(err) : resolve(row.GitToken);
        });
    });
}

async function addToken(teacherId) {
    const [token, tokenRefresh] = [await generateToken(), await generateToken()];
    const tokenRequestTime = new Date().getTime();
    const [tokenEndOfValidity, tokenEndOfRefreshValidity]
        = [tokenRequestTime + tokenDuration, tokenRequestTime + tokenRefreshDuration];

    const sqlAddToken = `INSERT INTO SessionToken(
                        SessionToken, EndOfValidity, RefreshToken, EndOfRefreshValidity, TeacherId 
                        ) VALUES (
                        ?, ?, ?, ?, ?
                        );`;

    return new Promise((resolve, reject) => {
        database.run(sqlAddToken, [token, tokenEndOfValidity, tokenRefresh,
                tokenEndOfRefreshValidity, teacherId],
            (err) => {
                err ? reject(err)
                    : resolve({token: token, refresh_token: tokenRefresh});
            })
    });
}

function checkTokenValidity(teacherId, token) {
    const sqlGetRowByTeacherIdAndToken = `SELECT * FROM SessionToken WHERE TeacherId = ? AND SessionToken = ?;`;

    return new Promise((resolve, reject) => {
        database.get(sqlGetRowByTeacherIdAndToken, [teacherId, token], (err, row) => {
            if (err) reject(err);
            if (row) {
                if (row.EndOfValidity < new Date().getTime())
                    resolve(false);
                else
                    resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

function checkRefreshTokenValidity(teacherId, refreshToken) {
    const sqlGetRowByTeacherIdAndRefreshToken = `SELECT * FROM SessionToken WHERE TeacherId = ? AND RefreshToken = ?;`;

    return new Promise((resolve, reject) => {
        database.get(sqlGetRowByTeacherIdAndRefreshToken, [teacherId, refreshToken], (err, row) => {
            if (err) reject(err);
            if (row) {
                if (row.EndOfRefreshValidity < new Date().getTime())
                    resolve(false);
                else
                    resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

//tryOctoRequest();

//addTeacher("admin","admin", "token_for_tests");

function initializeDatabase() {
    database.serialize(() => {
        const sqlCreateTableTeacher = `CREATE TABLE IF NOT EXISTS Teacher (
            TeacherId INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT,
            Surname TEXT,
            Username TEXT NOT NULL UNIQUE,
            PasswordHash TEXT NOT NULL,
            GitToken TEXT NOT NULL UNIQUE
            );`;
        const sqlCreateTableToken = `CREATE TABLE IF NOT EXISTS SessionToken (
            TokenId INTEGER PRIMARY KEY AUTOINCREMENT,
            SessionToken TEXT NOT NULL,
            EndOfValidity INTEGER NOT NULL,
            RefreshToken TEXT NOT NULL,
            EndOfRefreshValidity INTEGER NOT NULL,
            TeacherId INTEGER NOT NULL,
            FOREIGN KEY (TeacherId) REFERENCES Teacher(TeacherId)
            );`;
        const sqlCreateTableProject = `CREATE TABLE IF NOT EXISTS Project(
            ProjectId INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL, 
            Description TEXT,
            DateOfCreation TEXT,
            Organization TEXT NOT NULL,
            MinCollaborators INTEGER NOT NULL,
            MaxCollaborators INTEGER NOT NULL,
            TaggedGroup TEXT NOT NULL,
            Url TEXT NOT NULL,
            TeacherId INTEGER NOT NULL,
            FOREIGN KEY (TeacherId) REFERENCES Teacher(TeacherId)
            );`;

        const sqlOrders = [sqlCreateTableTeacher, sqlCreateTableToken, sqlCreateTableProject];

        sqlOrders.forEach((sqlOrder, count) => {
            count++
            database.run(sqlOrder, (err) => {
                err ? console.log(`Error occurred: ${err.message}`) : console.log(`Successfully exced sql order ${sqlOrder.substring(0, 40)}...`);
            });
        });
    });
}

//GITHUB API
async function canCreateRepo(organizationName, githubToken) {
    const octokit = new Octokit({
        auth: githubToken,
    });
    try {
        const org = await octokit.rest.orgs.get({
            org: organizationName,
        });
        //vérfier s'il y a toujours de la place autorisée dans le plan pour l'ajout de repos privés.
        return org.data.plan.private_repos > org.data.owned_private_repos;
    } catch (error) {
        console.error(`An error occurred: ${error}`);
        return false;
    }
}

async function checkIfOrganizationExists(organizationName) {
    const octokit = new Octokit();
    try {
        await octokit.rest.orgs.get({
            org: organizationName
        });
        return true;
    } catch (error) {
        if (error.status === 404) {
            return false;
        }
        throw error;
    }
}

async function getGithubUser(username) {
    const octokit = new Octokit();
    try {
        return await octokit.rest.users.getByUsername({
            username: username,
        });
    } catch (error) {
        throw error;
    }
}

async function getReposFromOrg(organization, gitHubToken) {
    const octokit = new Octokit({
        auth: gitHubToken
    });

    try {
        return await octokit.rest.repos.listForOrg(
            {org: organization}
        );
    } catch (e) {
        console.log(e);
    }
}

async function checkIfUserIsARepositoryCollaborator(organizationName, repositoryName, gitHubUser, gitHubToken) {
    const octokit = new Octokit({
        auth: gitHubToken
    });

    try {
        return await octokit.rest.repos.checkCollaborator({
            owner: organizationName,
            repo: repositoryName,
            username: gitHubUser,
        });
    } catch (e) {
        console.log("Error when trying to check if user " + gitHubUser + " is part of repository")
    }
}

async function createRepository(organizationName, repositoryName, gitHubToken) {
    const octokit = new Octokit({
        auth: gitHubToken
    });

    try {
        return await octokit.rest.repos.createInOrg({
            org: organizationName,
            name: repositoryName,
        });
    } catch (e) {
        console.log(e);
    }
}

async function addCollaboratorToRepository(organizationName, repositoryName, gitHubUserToAdd, gitHubToken) {
    const octokit = new Octokit({
        auth: gitHubToken
    });

    try {
        return await octokit.rest.repos.addCollaborator({
            owner: organizationName,
            repo: repositoryName,
            username: gitHubUserToAdd,
            permission: "maintain"
        });
    } catch (e) {
        console.log(e);
    }
}

//CRYPTO
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            err ? reject(err)
                : resolve(hash);
        })
    });
}

function generateToken() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(tokenSize, (err, buf) => {
            err ? reject(err) : resolve(buf.toString('hex'));
        })
    })
}

async function uniqueUrl() {
    let url;
    let urlAlreadyExists;
    do {
        url = crypto.randomBytes(16).toString('hex');
        try {
            urlAlreadyExists = await getProjectWithUrl(url);
        } catch (e) {
            if (e === "no rows") {
                urlAlreadyExists = false;
            } else {
                throw e;
            }
        }
    } while (urlAlreadyExists);
    return url;
}

initializeDatabase();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
