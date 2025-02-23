module.exports = { CallAPI, Get_MultiPage_Request };
const { LogInfo } = require('./Logger.js');

//timeout for api calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);
const fs = require('fs');

// function requestOptions
try {
    const data = fs.readFileSync("config.json", 'utf8');
    configFile = JSON.parse(data);
    for (let key in configFile) {
        if (configFile[key] === null) {
            throw "Check .config file for null values";
        }
    }
} catch (error) {
    LogInfo(error);
}

function CreateHeader(requestMethod, bodyValues = null, additionalHeaderValues = null) {
    const requestOptions = {
        Knowledge_Owl: {
            method: requestMethod,
            headers: {
                ...additionalHeaderValues,
            },
            body: bodyValues ? JSON.stringify(bodyValues) : null,
            signal: controller.signal,
        },
        Intercom: {
            method: requestMethod,
            headers: {
                'Accept': 'application/json',
                'Intercom-Version': '2.11',
                'Content-Type': 'application/json',
                ...additionalHeaderValues,
            },
            body: bodyValues ? JSON.stringify(bodyValues) : null,
            signal: controller.signal,
        },
        TEST: {
            method: requestMethod,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: null,
            signal: controller.signal,
        },
    };
    return requestOptions;
}

function CallAPI(headerType, requestMethod, bodyValues = null, additional_header_values = null, apiUrl, apiArgs, pageCount) {
    return new Promise((resolve, reject) => {

        apiUrl += "?";
        if (apiArgs) {
            Object.entries(apiArgs).forEach(([key, value]) => {
                apiUrl += `${key}=${value}&`;
            });
        }
        apiUrl = pageCount ? apiUrl + pageCount : apiUrl.slice(0, -1);

        for (let i = 0; i < 3;) {
            try {
                const reqOptions = CreateHeader(requestMethod, bodyValues, additional_header_values);
                fetch(apiUrl, reqOptions[headerType], { signal: controller.signal })
                    .then(response => response.json())
                    .then(data => {
                        clearTimeout(timeoutId); // Only called on success
                        resolve(data);
                        LogInfo(`Response: ${data}`);
                    });
                break;
                // .catch(error => {
                //     console.error('There has been a problem with your fetch operation:', error);
                //     reject(error);
                // });
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error('Fetch aborted, retrying...', i + 1);
                    continue;
                }
                throw error; // If not an AbortError, break the loop
            }
        }
        //throw new Error('Fetch failed after retries');
    });
}

async function Get_MultiPage_Request(Call_Object,) {
    maxPages = 1;
    var content = [];
    for (let pageCount = 1; pageCount < maxPages + 1; pageCount++) {
        const resp = await CallAPI(
            Call_Object.headerType,
            Call_Object.queryMethod,
            Call_Object.additional_Body,
            Call_Object.additional_Headers,
            Call_Object.URL + (Call_Object.ID ? Call_Object.ID : ''),
            Call_Object.additional_Params,
            Call_Object.ID ? null : `page=${pageCount}`)
        if (resp.page_stats?.total_pages || resp.pages?.total_pages) {
            maxPages = resp.page_stats?.total_pages ?? resp.pages?.total_pages;
            for (let index = 0; index < resp.data.length; index++) {
                content.push(resp.data[index]);
                //LogInfo(`"${Call_Object.headerType}": "${resp.data[index].current_version.en.title}"`) ?? LogInfo(`"${Call_Object.headerType}": "${resp.data.current_version.en.title}"`);
                ;
            }
        } else {
            content.push(resp.data);
        }
        LogInfo(`"message":"${Call_Object.headerType} ${pageCount}"`);
        new Promise(resolve => setTimeout(resolve, 5));
    }
    return content;
}

async function Test_API_Caller() {
    var something = await CallAPI('TEST', 'GET', null, null, 'https://httpbin.org/json');
    console.log(JSON.stringify(something, null, 2));
}

//Test_API_Caller();
