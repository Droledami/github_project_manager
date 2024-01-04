const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const {Octokit} = require("octokit");
const bodyParser = require("body-parser");
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const PORT = 8080;

const app = express();

app.use(cors());
app.use(express.static("../build"));
app.use(bodyParser.json());

const tokenDuration = 30 * 60000; //30 minutes
const tokenRefreshDuration = tokenDuration * 2;
const tokenSize = 48;

let database = new sqlite3.Database("./database/gestion_projet_github.db", (err) => {
    if (err) {
        console.log(`Error opening database: ${err}`);
    } else {
        console.log("Database opened");
    }
});

initializeDatabase();

app.post('/login', async (req, res) => {
    try {
        const {username, password} = req.body;
        //Compare credentials with database content, returns user id
        try {
            const teacher = await authenticateCredentials(username, password);
            const teacherId = teacher.teacherId;
            const teacherGitToken = teacher.gitToken;
            console.log("Teacher id : " + teacherId);
            console.log("Teacher git token: " + teacherGitToken);
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
    try{
        const isAuthorized = await authorisationCheck(teacher_id, token, refresh_token);
        if(isAuthorized === true){
            res.sendStatus(200);//OK
        }else if (isAuthorized.token){
            const tokens = isAuthorized;
            console.log(isAuthorized);
            res.status(201).send({teacher_id: teacher_id, ...tokens});//Ok with data renewal
        }else{
            res.sendStatus(401);//Unauthorized
        }
    }catch (e) {
        res.sendStatus(500);//Internal server error
    }
});
///Returns new tokens if they can be refreshed. Otherwise, returns true or false;
async function authorisationCheck(teacher_id, token, refresh_token){
    try {
        const isAuthorized = await checkTokenValidity(teacher_id, token);
        if (isAuthorized) {
            return true;
        } else {
            const canRefresh = await checkRefreshTokenValidity(teacher_id, refresh_token);
            if (canRefresh) {
                const tokens = await addToken(teacher_id);
                return tokens;
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
        res.sendStatus(200).send(projects);
    } catch (e) {
        res.send(500).send("Could not load projects");
    }
});

app.get('/project', async (req, res) => {
    const projectId = req.query.id;
    try {
        const project = await getProjectWithId(projectId);
        res.sendStatus(200).send(project);
    } catch (e) {
        res.send(500).send(`Could not load project of id ${projectId}`);
    }
});

//TODO: get project through url

app.post('/project', async (req, res) => {
    console.log("tentative d'ajout de projet reçue:")
    console.log(req.body);
    const tokens = req.body.tokens;
    const isAuthorised = await authorisationCheck(tokens.teacher_id, tokens.token, tokens.refresh_token);
    if(!isAuthorised){
        res.sendStatus(401);
        return;
    }
    const projectToAdd = req.body.project_data;
    try {
        const url = crypto.randomBytes(16).toString('hex');
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
    const newProjectData = req.body;
    try {
        await editProject(newProjectData.name, newProjectData.description, newProjectData.organization, newProjectData.minCollaborators,
            newProjectData.maxCollaborators, newProjectData.taggedGroup, newProjectData.projectId);
    } catch (e) {

    }
});

const octokit = new Octokit({
    auth: 'token_for_tests',
});

//Example
async function tryOctoRequest() {
    try {
        const result = await octokit.request("GET /repos/{owner}/{repo}", {
            owner: "Droledami",
            repo: "MedicTime"
        });

        console.log(`Success! Status : ${result.status}. Rate limit remaing : ${result.headers["x-ratelimit-remaining"]}`);

        const titleAndAuthor = {title: result.data.name, description: result.data.description};

        console.log(titleAndAuthor)

    } catch (e) {
        console.log(`Error! Status: ${e.status}. Rate limit remaining: ${e.headers["x-ratelimit-remaining"]}. Message: ${e.response.data.message}`)
    }
}

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

function getProjectWithId(projectId) {
    return new Promise((resolve, reject) => {
        const sqlGetProjectWithId = `SELECT * FROM Project WHERE ProjectId = ?;`;
        database.get(sqlGetProjectWithId, projectId, (err, row) => {
            if (err) reject(`Error getting project with id ${projectId} from the database: ${err}`);
            if (!row) reject(`Error getting projects from the database: no rows found for id ${projectId}`);
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
                            MinCollaborators = ?, MaxCollaborators = ?, TaggedGroup = ?,
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

function addTeacher(teacherUsername, password, gitToken) {
    return new Promise(async (resolve, reject) => {
        const hashedPassword = await hashPassword(password);
        const sqlInsertTeacher = `INSERT INTO Teacher(
                        Username, PasswordHash, GitToken
                        ) VALUES (
                        ?, ?, ?
                        );`;
        database.run(sqlInsertTeacher, [teacherUsername, hashedPassword, gitToken],
            (err) => {
                err ? reject(err)
                    : resolve(`Teacher ${teacherUsername} added`);
            })
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

tryOctoRequest();

//addTeacher("admin","admin", "token_for_tests");

function initializeDatabase() {
    database.serialize(() => {
        const sqlCreateTableTeacher = `CREATE TABLE IF NOT EXISTS Teacher (
            TeacherId INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT,
            Surname TEXT,
            Username TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            GitToken TEXT NOT NULL
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
                err ? console.log(`Error occurred: ${err.message}`) : console.log(`Successfully exced sql order n° ${count}`);
            });
        });
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

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