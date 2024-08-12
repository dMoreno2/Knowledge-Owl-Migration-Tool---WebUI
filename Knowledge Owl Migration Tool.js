module.exports = { Program_Switch };


const fs = require('fs');
const path = require('path');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}
const logFilePath = path.join(path.join(__dirname, 'logs'), `log-${GetDateTime()}.json`);
fs.appendFile(logFilePath, `{`, (err) => { });

var configFile;
var iterationCount = 0;
var maxPages = 1;
var pageCount = 1;

var ko_Response = [];
var int_Response = [];

let _articleTile = 0; /// ko_Response [0] - Article Title - int_Response [0]
let _articleBody = 1; /// ko_Response [1] - Article Body  - int_Response [1]
let _articleID = 2;   /// ko_Response [2] - Article ID    - int_Response [2]
try {
    fs.readFile("config.json", 'utf8', (error, data) => {
        configFile = JSON.parse(data);
        for (let key in configFile) {
            if (configFile[key] === null) {
                throw "Check .config file for null values";
            }
        }
    });
}
catch (error) {
    LogInfo(error);
}

function Program_Switch(switchCase) {

    switch (switchCase) {
        case 1:
            //creates and updates
            Update_And_Create_Articles();
            break;
        case 2:
            //only updates
            UpdateArticlesOnly();
            break;
        case 3:
            //only creates
            CreatArticlesOnly();
            break;
        case 443:
            //this is a test case
            console.log("help me");
            break;
        default:
            console.log("whatever you did, didn't work...");
            break;
    }
}
function Update_And_Create_Articles() {
    Get_KO_Articles();
    Get_Intercom_Articles();   
    //ProcessArticles(create, update)
    ProcessArticles(true, true)
}
function UpdateArticlesOnly() {
    Get_KO_Articles();
    Get_Intercom_Articles();
    //ProcessArticles(create, update)
    ProcessArticles(false, true)
}
function CreatArticlesOnly() {
    Get_KO_Articles();
    Get_Intercom_Articles();
    //ProcessArticles(create, update)
    ProcessArticles(true, false)
}
async function Get_KO_Articles() {
    maxPages = 1;
    pageCount = 1;
    fs.appendFile(logFilePath, `{ "KO_Items:"`, (err) => { });
    do {
        const resp = await CallAPI("Knowledge_Owl", "GET", `${configFile.Knowledge_Owl.Search_URL}?`, `project_id=${configFile.Knowledge_Owl.Project_ID}`, "status=published", `page=${pageCount}`);
        for (let index = 0; index < resp.length; index++) {
            ko_Response.push(resp[index])
            LogInfo(`"ko-name": "${resp[index][_articleTile]}"`);
        }
        setTimeout(function Waitfor() {
            LogInfo(`"message":"ko-reply ${pageCount}"`);
        }, 100);
        pageCount++;
    } while (pageCount < maxPages + 1)
    fs.appendFile(logFilePath, `}`, (err) => { });
}
async function Get_Intercom_Articles() {
    maxPages = 1;
    pageCount = 1;
    fs.appendFile(logFilePath, `{ "INT_Items:"`, (err) => { });
    do {
        const resp = await CallAPI("Intercom", "GET", configFile.Intercom.Create_URL, '?page=' + pageCount);
        for (let index = 0; index < resp.length; index++) {
            int_Response.push(resp[index])
            LogInfo(`"int-name": "${resp[index][_articleTile]}"`);
        }
        setTimeout(function Waitfor() {
            LogInfo(`"message":"Int-reply ${pageCount}"`);
        }, 100);
        pageCount++;
    } while (pageCount < maxPages + 1)
    fs.appendFile(logFilePath, `}`, (err) => { });
}
async function ProcessArticles(create, update) {
    for (let ko_article = 0; ko_article < ko_Response.length; ko_article++) {
        var exists = false;
        for (let i = 0; i < int_Response.length; i++) {
            LogInfo(`"Checking for article": "${ko_Response[ko_article][_articleTile]}..."`);
            if (ko_Response[ko_article][_articleTile].trim() === int_Response[i][_articleTile].trim()) {
                if (update === true) {
                    LogInfo(`"Updating Article": "${ko_Response[ko_article][_articleTile]}"\n`);
                    await UpdateArticle(ko_article, _articleTile, i);
                    exists = true;
                    break;
                }
            }
            else {
                await setTimeout(function Waitfor() { }, 1000);
            }
        }
        if (exists == false && create === true) {
            LogInfo(`Creating article: ${ko_Response[ko_article][_articleTile]}...`);
            await CreateArticle(ko_article, _articleTile);
        }
        else {
            exists = false;
        }
        iterationCount++;
    }
}
async function UpdateArticle(ko_article, _articleTile, i) {
    const reply = await fetch(`https://api.intercom.io/articles/${int_Response[i][_articleID]}`, CreateHeader("Intercom", "PUT", JSON.stringify({
        body: ko_Response[ko_article][_articleBody].toString()
    })));
    const data = await reply.json();
    LogInfo(JSON.stringify(data, null, 2) + '\n');
    LogInfo(`"message":"Article Updated. Waiting..."`);
    await setTimeout(function Waitfor() { }, 5000)
}
async function CreateArticle(ko_article, _articleTile) {
    LogInfo(`"No article with matching title": "${ko_Response[ko_article][_articleTile]}", "Action":"Creating Article.."\n`);
    const reply = await fetch('https://api.intercom.io/articles', CreateHeader("Intercom", "POST", JSON.stringify({
        author_id: 7491322,
        title: ko_Response[ko_article][_articleTile].toString(),
        body: ko_Response[ko_article][_articleBody].toString(),
        state: 'draft'
    })));
    const data = await reply.json();
    LogInfo(JSON.stringify(data, null, 2) + '\n');
    LogInfo(`"message":"Article Created. Waiting..."`);
    await setTimeout(function Waitfor() { }, 3000)
}
function CallAPI(headerType, requestMethod, apiUrl, ...apiArgs) {
    return new Promise((resolve, reject) => {
        if (apiArgs.length > 0) {
            for (let i = 0; i < apiArgs.length; i++) {
                apiUrl += apiArgs[i] + '&';
            }
            apiUrl = apiUrl.slice(0, -1);
        }
        const reqOptions = CreateHeader(headerType, requestMethod);
        fetch(apiUrl, reqOptions)
            .then(response => {
                return response.json();
            })

            .then(data => {
                //console.log(JSON.stringify(data, null, 2));
                var apiItems = [];
                var article;
                if (data.data.length > 1) {
                    data.data.forEach(obj => {
                        if (headerType == "Knowledge_Owl") {
                            maxPages = data.page_stats.total_pages;
                            article = [obj.name, obj.current_version.en.text.replace(/\n/g, ''), obj.id];
                            apiItems.push(article);
                        }
                        else {
                            maxPages = data.pages.total_pages;
                            article = [obj.title, obj.body, obj.id]
                            apiItems.push(article);
                        }
                    });
                }
                else {
                    if (headerType == "Knowledge_Owl") {
                        article = [data.data.name, data.data.current_version.en.text.replace(/\n/g, ''), data.data.id];
                        apiItems.push(article);
                    }
                    else {
                        article = [data.title, data.body, data.id]
                        apiItems.push(article);
                    }
                }
                resolve(apiItems);
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
                reject(error);
            });
    });
}
function CreateHeader(system, requestMethod, bodyValues = null) {
    var requestOptions;
    switch (system) {
        case 'Knowledge_Owl':
            requestOptions = {
                method: requestMethod,
                headers: {
                    'Authorization': `Basic ${btoa(`${configFile.Knowledge_Owl.API_Key}:${configFile.Knowledge_Owl.Password}`)}`,
                },
            };
            return requestOptions;

        case 'Intercom':
            requestOptions = {
                method: requestMethod, headers: {
                    'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
                    'Accept': 'application/json',
                    'Intercom-Version': '2.11',
                    'Content-Type': 'application/json'
                },
                body: bodyValues,
            };
            return requestOptions;
    }
}
async function LogInfo(logContents) {
    const output = await fs.appendFile(logFilePath, `"${GetDateTime()}":{${logContents}\n},`, (err) => { });
    console.log(logContents);
}
function GetDateTime() {
    const currentDate = new Date();
    //DD-MM-YY--HH-MM-SS
    const now = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}--${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    return now
}