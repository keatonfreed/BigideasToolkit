let globalAnswers = {}
// import 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js'
// const MathQuill = require('https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1-a/mathquill.js')

document.body.onload = async () => {
    
    // const mathQuillLink = 
        // let jqueryImport = await import()    
        // let MathQuillImport = await import(mathQuillLink)
    let jqueryImport = await import(chrome.runtime?.getURL('assets/jquery.js'))    
    let MathQuillImport = await import(chrome.runtime?.getURL('assets/mathquill.js'))
    
    

    MathQuill = MathQuill.getInterface(2);
    window.MathQuill = MathQuill

    let showAns = false;
    let showCalc = false;
    let checkAns = false;
    let showMenu = false;

    chrome.storage.local.get(['showCalc', 'showAns', 'checkAns','showMenu'], (result) => {
        showAns = result.showAns || false;
        showCalc = result.showCalc || false;
        showMenu = result.showMenu || false;
        check = result.showCalc || false;
        updateCalculator()
    });
    console.log("ran content")

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log("GOT MESSAGE:",request,request.action)
        if (request.action === "toggleAns") {
            showAns = request.data
            if (!request.data) {
                document.querySelectorAll('.answerDisplay').forEach((el) => {
                    el.classList.remove('answerDisplay');
                    if (el.answerDel) {
                        el.answerDel(el)
                    } else {
                        el.remove()
                    }
                })
            }
        }
        if (request.action === "gotReq") {
            console.log("gotREQQ")
        }
        if (request.action === "toggleCalc") {
            showCalc = request.data
            updateCalculator()
        }
        if (request.action === "toggleCheckAns") {
            checkAns = request.data
        }
        if (request.action === "toggleMenu") {
            showMenu = request.data
            updateAnswers()
        }
        if (request.action === "setAnswers") {
            let icon = document.getElementById('BIToolkit')
            if(!icon) {
                console.log("adding watermark")
                let iconEl = document.createElement('img')
                iconEl.src = chrome.runtime.getURL('icon.png')
                iconEl.id = "BIToolkit"
                iconEl.style = "position:absolute;right:10px;top:10px;width:35px;height:35px;"
                document.body.appendChild(iconEl)
            }
            globalAnswers = request.data
            console.log("Recieved Answers:")
            console.log(request.data)
            setInterval(() => { updateAnswers() }, 500)
            updateAnswers()
            const styleTag = document.head.appendChild(document.createElement('style'));
            styleTag.textContent = `
                .dragAnswerDisplay:has(~ .lrn_draggable:not(.gu-transit)) {display:none}
                .BIMToolkitMenu {
                    width: 300px;
                    height: fit-content;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    position: absolute;
                    right: 0;
                    bottom: 0;
                    color: black;
                    background: gray;
                    z-index: 100;
                }
                .BIMToolkitMenu > div {
                    height: max-content;
                    display: flex;
                    flex-direction: row;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .BIMToolkitMenu > div :first-child {
                    font-weight:bold;
                }
                .BIMToolkitMenu > div * {
                    width: max-content;
                    text-wrap: nowrap;
                }
                `;
        }
    });

    // let questIndexEl = document.querySelector('.question-index span')
    let questIdEl = document.querySelector('.assessContent .bc-itemId')
    const observer = new MutationObserver(updateAnswers);
    observer.observe(questIdEl, { childList: true });

    function updateCalculator() {
        let calculator = document.querySelector('.lrn_calculator.lrn_feature.lrn-float-element');
        if (!calculator) {
            setTimeout(updateCalculator, 3000)
        } else {
            calculator.style.top = `${window.innerHeight / 2 - calculator.querySelector('.lrn_calc_content').offsetHeight}px`;
            calculator.style.left = `${window.innerWidth / 2 - calculator.querySelector('.lrn_calc_content').offsetWidth}px`;
            calculator.style.display = showCalc ? 'block' : 'none';
        }
    }
    function updateMenu() {
        let menu = document.querySelector('.BIMToolkitMenu');
        if (!menu) {
            menu = document.createElement('div')
            menu.className = "BIMToolkitMenu"
            document.body.appendChild(menu)
        }
        menu.style.display = showMenu ? 'flex' : 'none';
        if (!showMenu) {
            return
        }

        menu.innerHTML = ""
        
        globalAnswers[String(questIdEl.textContent)]?.answers.map(ans=>{
            let contain = document.createElement('div')
            let type = document.createElement('span')
            type.textContent = ans.type
            contain.appendChild(type)
            ans.value.forEach((val)=>{
                let valEl = document.createElement('span')
                if(typeof val == "object") val = JSON.stringify(val)
                valEl.textContent = val
                contain.appendChild(valEl)
            })
            menu.appendChild(contain)
        })
        
    }

    function getHTMLComparableValue(val) {
        var txt = document.createElement("textarea");
        txt.innerHTML = val;
        return txt.value;
    }
    function updateAnswers() {
        updateMenu()
        if (!showAns) {
            return
        }
        // console.log("UPDATE")
        let thisPage = document.querySelector(`[data-reference='${String(questIdEl.textContent)}'].item`)
        let inputQuestions = thisPage?.querySelectorAll('.lrn_response_input:has(.lrn_textinput)') || [];
        for (let i = 0; i < inputQuestions.length; i++) {
            let textAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "text")[i]
            let thisTextAnswers = textAnswers?.value;
            let textInputs = inputQuestions[i]?.querySelectorAll('.lrn_textinput') || [];
            for (let j = 0; j < textInputs.length; j++) {
                let textField = textInputs[j];
                let thisTextAnswer = thisTextAnswers[j];
                if (thisTextAnswer && !textField.querySelector('.answerDisplay')) {
                    let placeholder = document.createElement('span');
                    placeholder.className = 'answerDisplay';
                    placeholder.style.opacity = '0.5';
                    var config = {handlers: {edit: function (edit) {}},};
                    let mathField = MathQuill.StaticMath(placeholder, config);
                    mathField.latex(thisTextAnswer);
                    textField.insertBefore(placeholder, textField.firstChild);
                    let copyButton = document.createElement('img');
                    copyButton.className = 'copyAnswers';
                    copyButton.src = chrome.runtime.getURL('assets/copy.webp')
                    copyButton.style = "aspect-ratio: 1; height: 20px; margin-left: 10px; cursor: pointer"
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(thisTextAnswer);
                        textField.querySelector('.mq-textarea textarea').focus()
                    }
                    placeholder.appendChild(copyButton);
                    placeholder.querySelectorAll('span').forEach((el) => {
                        if (el.style.transform === 'scale(0.8, 0)') {
                            el.style.transform = 'scale(1,1)'
                        }
                    })
                }
            }
        }
        let formulaQuestions = thisPage?.querySelectorAll('.lrn_response_input.lrn_bordered_mathinput:has(span.lrn_bordered_mathinput)') || [];
        for (let i = 0; i < formulaQuestions.length; i++) {
            let formulaAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "formula")[i]
            let thisFormulaAnswers = formulaAnswers?.value;
            let formulaInputs = formulaQuestions[i]?.querySelectorAll('span.lrn_math_editable') || [];
            for (let j = 0; j < formulaInputs.length; j++) {
                let formulaField = formulaInputs[j];
                let thisFormulaAnswer = thisFormulaAnswers[j];
                if (thisFormulaAnswer && !formulaField.querySelector('.answerDisplay')) {
                    let placeholder = document.createElement('span');
                    placeholder.className = 'answerDisplay';
                    placeholder.style.opacity = '0.5';
                    var config = {handlers: {edit: function (edit) {}},};
                    let mathField = MathQuill.StaticMath(placeholder, config);
                    mathField.latex(thisFormulaAnswer);
                    formulaField.insertBefore(placeholder, formulaField.firstChild);
                    placeholder.querySelectorAll('span').forEach((el) => {
                        if (el.style.transform === 'scale(0.8, 0)') {
                            el.style.transform = 'scale(1,1)'
                        }
                    })
                }
            }
        }
        let dropQuestions = thisPage?.querySelectorAll('.lrn_response_input:has(.lrn-cloze-select)') || [];
        for(let i = 0; i<dropQuestions.length;i++) {
            let dropInputs = dropQuestions[i]?.querySelectorAll('.lrn-cloze-select') || [];
            let thisDropAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "dropdown")[i]?.value;
            // console.log("DROPS",dropInputs)
            for (let h = 0; h < dropInputs.length; h++) {
                let dropEl = dropInputs[h];
                let choices = dropEl.childNodes;
                let dropAns = thisDropAnswers[h]
                if (dropAns && !dropEl.parentElement.classList.contains('answerDisplay')) {
                    dropEl.parentElement.classList.add('answerDisplay')
                    dropEl.parentElement.style = "text-align: center;display: flex;border: 1px solid black;width: min-content;height: min-content;flex-direction: column;padding: 5px;"
                    if(!dropEl.parentElement.querySelector('span')) {
                        let placehold = document.createElement('span')
                        placehold.textContent = dropAns;
                        dropEl.parentElement.insertBefore(placehold,dropEl.parentElement.firstChild);
                        dropEl.parentElement.answerDel = (el) => {
                            placehold.remove()
                            dropEl.parentElement.style = ""
                        };
                    }

                    for (let j = 0; j < choices.length; j++) {
                        if (choices[j].value === dropAns) {
                            choices[j].style.fontWeight = 'bold'
                            choices[j].answerDel = (el) => {
                                el.style.fontWeight = ''
                            };
                            choices[j].classList.add('answerDisplay');
                        }
                    }
                }
            }
        }

        let multiChoices = thisPage?.querySelectorAll('.lrn_mcqgroup') || [];
        for (let i = 0; i < multiChoices.length; i++) {
            let thisChoiceAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "choice")[i]?.value;
            let choiceEl = multiChoices[i];
            let choices = choiceEl.childNodes;
            if (thisChoiceAnswers) {
                for (let j = 0; j < choices.length; j++) {
                    if (!choices[j].classList.contains('answerDisplay') && thisChoiceAnswers.includes(choices[j].querySelector('input').value)) {
                        choices[j].style.border = '2px solid gray';
                        choices[j].answerDel = (el) => {
                            el.style.border = ''
                        };
                        choices[j].classList.add('answerDisplay');
                    }
                }
            }
        }
        

        let dragQuestions = thisPage?.querySelectorAll('.lrn_response_input:has(.lrn_dropzone)') || [];
        for (let i = 0; i < dragQuestions.length; i++) {
            let dragSlots = dragQuestions[i]?.querySelectorAll('.lrn_dropzone') || [];
            let thisDragAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "drag")[i]?.value.map(el=>{return getHTMLComparableValue(el)}) || [];
            let notFound = []
            for (let j = 0; j < thisDragAnswers.length; j++) {
                let dragOption = Array.from(dragQuestions[i]?.parentNode.querySelectorAll(`.lrn_draggable[aria-label]`)).find(el=>el.getAttribute('aria-label') == thisDragAnswers[j]);
                if (dragOption && !dragOption.querySelector(`.answerDisplay${j}`)) {
                    let placeholder = document.createElement('span');
                    placeholder.classList.add('answerDisplay');
                    placeholder.classList.add('answerDisplay' + j);
                    placeholder.textContent = j+1
                    placeholder.style = "position: absolute;bottom: 0;right: 0;padding: 5px;background-color: rgba(0,0,0,0.4);color:white;"
                    dragOption.style = "position:relative"
                    dragOption.appendChild(placeholder);
                    placeholder.answerDel = (el) => {
                        placeholder.remove()
                    };
                } else if (!dragOption) {
                    notFound.push(j)
                    // console.log(Array.from(dragQuestions[i]?.parentNode.querySelectorAll(`.lrn_draggable[aria-label]`)).map(el=>[el.getAttribute('aria-label'),thisDragAnswers[j],el.getAttribute('aria-label') == thisDragAnswers[j]]))
                }
            }
            for (let h = 0; h < dragSlots.length; h++) {
                let dragSlot = dragSlots[h]
                if (dragSlot && !dragSlot.querySelector(`.answerDisplay`)) {
                    let placeholder = document.createElement('p');
                    placeholder.classList.add('answerDisplay');
                    placeholder.classList.add('dragAnswerDisplay');
                    placeholder.textContent = notFound.includes(h) ? thisDragAnswers[h] : h+1
                    placeholder.style = "margin:auto;padding-inline:10px;color:red;text-align:center;"
                    dragSlot.style = "position:relative"
                    dragSlot.appendChild(placeholder);
                    placeholder.answerDel = (el) => {
                        placeholder.remove()
                    };
                }
            }
        }
    }
}
