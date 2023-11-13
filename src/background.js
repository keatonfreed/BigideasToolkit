
console.log("ran")

// setInterval(()=>{console.log("running")},500)
async function handleNetworkReq(details) {
    if (details?.url?.includes('questionresponses') && details?.requestBody?.formData?.action?.includes('get') && !details.requestBody.formData.toolkit) {
        console.log("Hit")
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "gotReq" });
        });
        const formData = new FormData();
        for (const key in details.requestBody.formData) {
            formData.append(key, details.requestBody.formData[key]);
        }
        formData.append('toolkit', true);

        setTimeout(() => {
            fetch(details.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams([...formData.entries()])
            })
                .then(response => response.json())
                .then(data => {

                    console.log('Result:', data);
                    let answers = extractQuestions(data.data);

                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "setAnswers", data: answers });
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }, 150)
    }
}


function extractQuestions(data) {

    let questions = {};

    function findQuestionValues(arr,type) {
        let result = [];

        function helper(subArr) {
            for (const item of subArr) {
                // console.log("parse...",item,type == "obj",typeof item === 'object',!Array.isArray(item),typeof item === 'object' ? !('value' in item) : "No")
                if (typeof item === 'string') result.push(item);
                else if (type == "obj" && typeof item === 'object' && !Array.isArray(item) && !('value' in item)) result.push(item);
                else if (typeof item === 'object' && 'value' in item) result.push(item.value);
                else if (Array.isArray(item)) helper(item);
            }
        }

        helper(arr);
        return result;
    }

    data.forEach(item => {
        const answers = [];
        const question = item.question;
        if (question && question.validation && question.validation.valid_response) {
            const validResponse = question.validation.valid_response;
            let thisQuest = validResponse.value;

            function getType(type) {
                let out = '';

                switch (type) {
                    case "formulaV2":
                        out = "formula"
                        break;
                    case "clozeformula":
                        out = 'text'
                        break;
                    case "clozeassociation":
                    case "association":
                        out = 'drag'
                        break;
                    case "mcq":
                        out = 'choice'
                        break;
                    case "clozedropdown":
                        out = 'dropdown'
                        break;
                    case "graphplotting":
                        out = 'graph'
                        break;
                    default:
                        out = 'other'
                        break;
                }

                return out;
            }

            let thisType = getType(question.type)
            if(thisType == "other") {
                console.log("OTHER:",question,"MID",item)
            }
            let thisValueType = "str"
            if(thisType == "graph") {
                thisValueType = "obj"
            }
            let thisAns = findQuestionValues(thisQuest,thisValueType)
            answers.push({ type: thisType, original:question.type, value: thisAns });
        }
        let questionId = question.metadata.sheet_reference
        questions[questionId] = questions[questionId] || { answers: [] }
        answers.forEach(ans => {
            questions[questionId].answers.push(ans)
        })
    });

    return questions;
}

// chrome.webRequest.onBeforeSendHeaders.addListener(
//     handleNetworkReq,
//     { urls: ['*://questions.learnosity.com/*'] });

chrome.webRequest.onBeforeRequest.addListener(
    handleNetworkReq,
    { urls: ['*://questions.learnosity.com/*'] },
    ['requestBody']
);
