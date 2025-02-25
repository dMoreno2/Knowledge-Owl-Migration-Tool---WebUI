module.exports = { Program_Switch };
const { LogInfo } = require('./Logger.js');
const { CallAPI } = require('./API Caller.js');
const { Get_MultiPage_Request } = require('./API Caller.js');

const fs = require('fs');

var configFile;
var maxPages = 1;

var source_Articles = [];
var dest_Articles = [];

var TESTMODE = false;
try {
    var data;
    if (!TESTMODE) {
        data = fs.readFileSync("config.json", 'utf8');
    }
    else {
        data = fs.readFileSync("testConfig.json", 'utf8');
    }
    configFile = JSON.parse(data);
    for (let key in configFile) {
        if (configFile[key] === null) {
            throw "Check .config file for null values";
        }
    }
} catch (error) {
    LogInfo(error);
}
async function Program_Switch(switchCase, flag = null) {
    LogInfo(`switch starting : Case ${switchCase}`, 'yellow');
    try {
        switch (switchCase) {
            case 1:
                //creates and updates
                LogInfo(`switch triggered : Case ${switchCase}`, 'green');
                await Update_And_Create_Articles();
                break;
            case 2:
                //only updates
                LogInfo(`switch triggered : Case ${switchCase}`, 'green');
                await Update_Articles_Only(flag);
                break;
            case 3:
                //only creates
                LogInfo(`switch triggered : Case ${switchCase}`, 'green');
                await Create_Articles_Only(flag);
                break;
            case 4:
                //only creates
                LogInfo(`switch triggered : Case ${switchCase}`, 'green');
                await DeleteArticle(flag);
                break;
            case 443:
                //this is a test case
                console.log("443 Test Case");
                console.log(`Flag: ${flag}`);
                break;
            default:
                console.log("whatever you did, didn't work...");
                break;
        }
    } catch (error) {
        LogInfo(`error: ${error}`, 'red');
    }
    return true;
}
async function Update_And_Create_Articles() {
    await Update_Articles_Only();
    await Create_Articles_Only();
    LogInfo("Final:Processing Complete");
}
async function Update_Articles_Only(id) {
    source_Articles = await Get_KO_Articles(id);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    dest_Articles = await Get_Int_Articles();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    await ReplaceSnippets(await GetSnippets());

    //ProcessArticles(create, update)
    await ProcessArticles(false, true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    LogInfo("Final:Processing Complete");
}
async function Create_Articles_Only(id) {
    source_Articles = await Get_KO_Articles(id);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    dest_Articles = await Get_Int_Articles();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    await ReplaceSnippets(await GetSnippets());

    //ProcessArticles(create, update)
    await ProcessArticles(true, false);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work

    LogInfo("Final:Processing Complete");
}
async function DeleteArticle(id) {
    //WHY?
    //This function shouldn't exist should it? Maybe theres a fustification but I don't know it
    //So I won't build it
}
async function Get_KO_Articles(id = '') {
    return await Get_MultiPage_Request({
        headerType: "Knowledge_Owl",
        queryMethod: "GET",
        additional_Headers: {
            'Authorization': `Basic ${btoa(`${configFile.Knowledge_Owl.API_Key}:${configFile.Knowledge_Owl.Password}`)}`
        },
        URL: id ? `${configFile.Knowledge_Owl.Get_URL}` : `${configFile.Knowledge_Owl.Search_URL}`,
        ID: `${id}` ? id : null,
        additional_Params: {
            project_id: `${configFile.Knowledge_Owl.Project_ID}`,
            status: 'published'
        }
    });
}
async function Get_Int_Articles(id = '') {
    let resp = await Get_MultiPage_Request({
        headerType: "Intercom",
        queryMethod: "GET",
        additional_Headers: {
            'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
        },
        URL: `${configFile.Intercom.Create_URL}`,
        ID: `${id}`,
    });
    return resp.flat();
}
async function ProcessArticles(create, update) {
    let { articlesToUpdate, articlesToCreate } = await Return_Update_and_Create_Articles();
    if (create) {
        for (let article of articlesToCreate) {
            await Create_An_Article(article);
        }
    }
    if (update) {
        for (let article of articlesToUpdate) {
            await Update_An_Article(article);
        }
    }
}
async function Return_Update_and_Create_Articles() {
    let articlesToUpdate = [];
    let articlesToCreate = [];

    for (let sourceArticle of source_Articles) {
        let found = false;

        for (let dest_Article of dest_Articles) {
            if (sourceArticle.current_version.en.title.replace(/\s+/g, '') === dest_Article.title.replace(/\s+/g, '')) {
                articlesToUpdate.push({ ...sourceArticle, external_id: dest_Article.id });
                found = true;
                break;
            }
        }
        if (!found) {
            articlesToCreate.push(sourceArticle);
        }
    }
    return { articlesToCreate, articlesToUpdate };
}
async function Update_An_Article(article) {
    await Get_MultiPage_Request({
        headerType: "Intercom",
        queryMethod: "PUT",
        additional_Body: {
            body: article.current_version.en.text
        },
        additional_Headers: {
            'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
        },
        URL: `${configFile.Intercom.Create_URL}/`,
        ID: `${article.external_id}`
    });
    // const data = await reply.json();
    // LogInfo(JSON.stringify(data, null, 2) + '\n', 'blue');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work
}
async function Create_An_Article(article) {
    await Get_MultiPage_Request({
        headerType: "Intercom",
        queryMethod: "POST",
        additional_Headers: {
            'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
        },
        URL: `${configFile.Intercom.Create_URL}`,
        additional_Body: {
            author_id: 7491322,
            title: article.current_version.en.title,
            body: article.current_version.en.body,
            state: 'draft'
        }
    });
    // const data = await reply.json();
    // LogInfo(JSON.stringify(data, null, 2) + '\n', 'blue');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulates async work
}
async function GetSnippets() {
    try {
        const response = Get_MultiPage_Request({
            headerType: "Knowledge_Owl",
            queryMethod: "GET",
            additional_Headers: {
                'Authorization': `Basic ${btoa(`${configFile.Knowledge_Owl.API_Key}:${configFile.Knowledge_Owl.Password}`)}`
            },
            URL: `https://app.knowledgeowl.com/api/head/snippet.json`,
            additional_Params: {
                project_id: `${configFile.Knowledge_Owl.Project_ID}`
            }
        })
        return response; // Return the processed data
    }
    catch {
        console.error(error);
    }
}
function ReplaceSnippets(snippetData) {
    for (let index = 0; index < snippetData.length; index++) {
        for (let sourceIndex = 0; sourceIndex < source_Articles.length; sourceIndex++) {
            // Escape special regex characters in the placeholder
            const placeholder = `{{snippet.${snippetData[index].mergecode}}}`;
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes regex special chars

            // Build a dynamic regex for case-insensitive global matching
            const regex = new RegExp(escapedPlaceholder, "gi");

            // Check and replace the placeholder
            if (regex.test(source_Articles[sourceIndex].current_version.en.text)) {
                console.log(`Replacing ${placeholder}`);

                // Perform the replacement
                source_Articles[sourceIndex].current_version.en.text = source_Articles[sourceIndex].current_version.en.text.replace(regex, snippetData[index].current_version.en);
            }
            new Promise(resolve => setTimeout(resolve, 5)); // Simulates async work
        }
    }
}
function ReplaceArticleLinks() {
    for (let sourceIndex = 0; sourceIndex < source_Articles.length; sourceIndex++) { // for each article
        for (let b = 0; b < source_Articles.length; b++) {  // for each link on each article
            if (source_Articles[sourceIndex][_articleBody].includes(source_Articles[b][_articleLink])) {
                //console.log(`Article body contains link: ${source_Articles[b][_articleLink]}`);
                for (let intArticle = 0; intArticle < dest_Articles.length; intArticle++) {
                    const koTitle = source_Articles[b][_articleTitle].replace(/\s+/g, '');
                    const intTitle = dest_Articles[intArticle][_articleTitle].replace(/\s+/g, '');
                    if (koTitle === intTitle) {
                        var newBody = source_Articles[sourceIndex][_articleBody]
                            .replaceAll(`href=\"\/\/eahelp.eventsair.com/home${source_Articles[b][_articleLink]}`, dest_Articles[intArticle][_articleLink])
                            .replaceAll(`href=\"\/\/eahelp.eventsair.com/help${source_Articles[b][_articleLink]}`, dest_Articles[intArticle][_articleLink])
                            .replaceAll(`href=\"https://eahelp.eventsair.com/help${source_Articles[b][_articleLink]}`, dest_Articles[intArticle][_articleLink])
                            .replaceAll(`href=\"https://eahelp.eventsair.com/home${source_Articles[b][_articleLink]}`, dest_Articles[intArticle][_articleLink]);
                        source_Articles[sourceIndex][_articleBody] = newBody;
                    }
                    new Promise(resolve => setTimeout(resolve, 5)); // Simulates async work
                }
            }
            new Promise(resolve => setTimeout(resolve, 5)); // Simulates async work
        }
        new Promise(resolve => setTimeout(resolve, 1)); // Simulates async work
    }
}
async function TestAPI() {
    source_Articles = await Get_MultiPage_Request({
        headerType: "Knowledge_Owl",
        queryMethod: "GET",
        additional_Headers: {
            'Authorization': `Basic ${btoa(`${configFile.Knowledge_Owl.API_Key}:${configFile.Knowledge_Owl.Password}`)}`
        },
        URL: `${configFile.Knowledge_Owl.Get_URL}`,
        ID: "6477c45857fb5905ec22a946",
        additional_Params: {
            project_id: `${configFile.Knowledge_Owl.Project_ID}`
        }
    });
    source_Articles = [];
    source_Articles = await Get_MultiPage_Request({
        headerType: "Knowledge_Owl",
        queryMethod: "GET",
        additional_Headers: {
            'Authorization': `Basic ${btoa(`${configFile.Knowledge_Owl.API_Key}:${configFile.Knowledge_Owl.Password}`)}`
        },
        URL: `${configFile.Knowledge_Owl.Search_URL}`,
        ID: "",
        additional_Params: {
            project_id: `${configFile.Knowledge_Owl.Project_ID}`,
            status: "published"
        }
    })


    dest_Articles = await Get_MultiPage_Request({
        headerType: "Intercom",
        queryMethod: "GET",
        additional_Headers: {
            'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
        },
        URL: `${configFile.Intercom.Create_URL}`,
    });
    dest_Articles = [];
    source_Articles = await Get_MultiPage_Request({
        headerType: "Intercom",
        queryMethod: "GET",
        additonal_Headers: {
            'Authorization': `Bearer ${configFile.Intercom.Bearer_Token}`,
        },
        URL: `${configFile.Intercom.Create_URL}`,
        ID: "/9812221",
    });
}

//TestAPI();