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

//TODO: J'étais ici
app.get('/login', async (req, res) => {
    try {
        const {teacherUsername, password} = req.body;
        //Compare credentials with database content, returns user id
        const teacherId = await authenticateCredentials(teacherUsername, password);
        //get token and refresh token
        const tokens = await addToken(teacherId);
        //send object with token, refresh_token and userId
        res.send({teacher_id: teacherId, ...tokens});
    } catch (e) {
        console.error(e)
        res.sendStatus(500).json({userid: undefined, token: undefined, tokenRefresh: undefined});
    }
});

app.get('/projects', async (req, res) => {
    //TODO: validate the token from req
    try {
        const projects = await getAllProjects();
        res.sendStatus(200).send(projects);
    } catch (e) {
        res.send(500).send("Could not load projects");
    }
});

app.get('/project', async (req, res) => {
    //TODO: validate the token from req
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
    //TODO: validate the token from req
    const projectToAdd = req.body;
    try {
        const url = crypto.randomBytes(16).toString('hex');
        await addProject(
            projectToAdd.name, projectToAdd.description, projectToAdd.organization, projectToAdd.minCollaborators,
            projectToAdd.maxCollaborators, projectToAdd.taggedGroup, url, projectToAdd.teacherId);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500).send("Error adding project");
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
    const sqlSelectUser = `SELECT TeacherId, PasswordHash, GitToken FROM User WHERE Username = ?`;
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

async function addProject(projectName, description, organization,
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
                    : resolve(`User ${projectName} added`);
            })
    });
}

function addTeacher(teacherUsername, password, gitToken) {
    return new Promise(async (resolve, reject) => {
        const hashedPassword = await hashPassword(password);
        const sqlInsertUser = `INSERT INTO Teacher(
                        Username, PasswordHash, GitToken
                        ) VALUES (
                        ?, ?, ?
                        );`;
        database.run(sqlInsertUser, [teacherUsername, hashedPassword, gitToken],
            (err) => {
                err ? reject(err)
                    : resolve(`User ${teacherUsername} added`);
            })
    });
}

async function addToken(teacherId) {
    const [token, tokenRefresh] = [await generateToken(), await generateToken()];
    const tokenRequestTime = new Date().getTime();
    const [tokenEndOfValidity, tokenEndOfRefreshValidity]
        = [tokenRequestTime + tokenDuration, tokenRequestTime + tokenRefreshDuration];

    const sqlAddToken = `INSERT INTO Token(
                        Token, EndOfValidity, RefreshToken, EndOfRefreshValidity, TeacherId 
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

tryOctoRequest();

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
})