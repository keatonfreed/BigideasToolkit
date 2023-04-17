let globalAnswers = {}

document.body.onload = async () => {
    const mathQuillLink = 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1-a/mathquill.js'


    let jqueryImport = await import('https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js')
    let MathQuillImport = await import(mathQuillLink)
    MathQuill = MathQuill.getInterface(2);
    window.MathQuill = MathQuill

    let showAns = false;
    let showCalc = false;
    let checkAns = false;

    chrome.storage.local.get(['showCalc', 'showAns', 'checkAns'], (result) => {
        showAns = result.showAns || false;
        showCalc = result.showCalc || false;
        check = result.showCalc || false;
        updateCalculator()
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
        if (request.action === "toggleCalc") {
            showCalc = request.data
            updateCalculator()
        }
        if (request.action === "toggleCheckAns") {
            checkAns = request.data
        }
        if (request.action === "setAnswers") {
            globalAnswers = request.data
            setInterval(() => { updateAnswers() }, 10)
        }
    });

    // let questIndexEl = document.querySelector('.question-index span')
    let questIdEl = document.querySelector('.assessContent .bc-itemId')

    function updateCalculator() {

        let calculator = document.querySelector('.lrn_calculator.lrn_feature.lrn-float-element');
        // let calculator = document.querySelector('.toolkitCalc');
        // let calcSize = 500
        if (!calculator) {
            setTimeout(() => {
                updateCalculator()
                //     calculator = document.createElement('iframe');
                //     calculator.className = 'toolkitCalc';
                //     calculator.src = '//www.mathway.com/problemwidget.aspx';
                //     calculator.style.width = `${calcSize}px`;
                //     calculator.style.height = `${calcSize}px`;
                //     calculator.style.position = `absolute`;
                //     calculator.style.top = `${window.innerHeight / 2 - calcSize / 2}px`;
                //     calculator.style.left = `${window.innerWidth / 2 - calcSize / 2}px`;
                //     calculator.style.border = '1px solid #DDD';
                //     calculator.style.borderRadius = '5px';
                //     calculator.style.zIndex = '10';
                //     document.body.appendChild(calculator);
                //     // calculator.style.position = 'absolute';
                //     // calculator.style.dra = 'absolute';
                //     // calculator.style.top = '10px';
                //     // calculator.style.left = '10px';
                //     // calculator.style.border = 'none';
                //     // calculator.style.width = '5px';
                //     // calculator.style.height = '220px';
                //     // calculator.style.zIndex = '9999';
            }, 200)
        } else {
            calculator.style.top = `${window.innerHeight / 2 - calculator.querySelector('.lrn_calc_content').offsetHeight}px`;
            calculator.style.left = `${window.innerWidth / 2 - calculator.querySelector('.lrn_calc_content').offsetWidth}px`;
            calculator.style.display = showCalc ? 'block' : 'none';
        }
    }
    function updateAnswers() {
        if (!showAns) {
            return
        }
        let thisQuest = document.querySelector(`[data-reference='${String(questIdEl.textContent)}'].item`)
        let questions = thisQuest?.querySelectorAll('.lrn_response_input') || [];
        for (let i = 0; i < questions.length; i++) {
            let textInputs = questions[i]?.querySelectorAll('.lrn_textinput') || [];
            let thisTextAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "text")[i].value;
            for (let j = 0; j < textInputs.length; j++) {
                let textField = textInputs[j];
                let thisTextAnswer = thisTextAnswers[j];
                if (thisTextAnswer && !textField.querySelector('.answerDisplay')) {
                    let placeholder = document.createElement('span');
                    placeholder.className = 'answerDisplay';
                    placeholder.style.opacity = '0.5';
                    var config = {
                        handlers: {
                            edit: function (edit) {
                                // edit.latex(thisTextAnswer)

                            }
                        },
                        // restrictMismatchedBrackets: true
                    };
                    var mathField = MathQuill.StaticMath(placeholder, config);
                    mathField.latex(thisTextAnswer);

                    textField.insertBefore(placeholder, textField.firstChild);

                    let copyButton = document.createElement('img');
                    copyButton.className = 'copyAnswers';
                    copyButton.src = chrome.runtime.getURL('assets/copy.webp')
                    copyButton.style = "aspect-ratio: 1; height: 20px; margin-left: 10px; cursor: pointer"
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(thisTextAnswer);
                        textField.querySelector('.mq-textarea textarea').focus()
                        // let e = $.Event('keypress');
                        // e.key = 'w';
                        // $(textField).trigger(e);
                        // console.log("copied", textField);
                        // let ansField = MathQuill(textField.querySelector('.lrn_math_editable'));
                        // console.log("copING", ansField);
                        // ansField.latex(thisTextAnswer);
                    }
                    placeholder.appendChild(copyButton);
                    // let editTimeout;
                    // placeholder.querySelector('textarea').onchange = () => {
                    //     editTimeout = setTimeout(() => { mathField.latex(thisTextAnswer); }, 10)
                    //     console.log("edit")
                    // }
                    placeholder.querySelectorAll('span').forEach((el) => {
                        if (el.style.transform === 'scale(0.8, 0)') {
                            el.style.transform = 'scale(1,1)'
                        }
                    })
                }
            }
        }

        let multiChoices = thisQuest?.querySelectorAll('.lrn_mcqgroup') || [];
        for (let i = 0; i < multiChoices.length; i++) {
            let thisChoiceAnswers = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "choice")[i].value;
            let choiceEl = multiChoices[i];
            let choices = choiceEl.childNodes;
            for (let j = 0; j < choices.length; j++) {
                if (thisChoiceAnswers && !choices[j].classList.contains('answerDisplay')) {
                    if (thisChoiceAnswers.includes(choices[j].querySelector('input').value)) {
                        choices[j].style.outline = '2px solid gray';
                        choices[j].answerDel = (el) => {
                            el.style.outline = ''
                        };
                        choices[j].classList.add('answerDisplay');
                    }
                }
            }
        }

        let dropChoices = thisQuest?.querySelectorAll('.lrn-cloze-select') || [];
        for (let i = 0; i < dropChoices.length; i++) {
            let thisDropAnswer = globalAnswers[String(questIdEl.textContent)].answers.filter(answer => answer.type === "dropdown")[i].value[0];
            let dropEl = dropChoices[i];
            if (thisDropAnswer && !dropEl.querySelector('.answerDisplay')) {
                let choices = dropEl.childNodes;
                for (let i = 0; i < choices.length; i++) {
                    if (choices[i].value === thisDropAnswer) {
                        choices[i].style.fontWeight = 'bold'
                        choices[i].answerDel = (el) => {
                            el.style.fontWeight = ''
                        };
                    }
                }
            }
        }
    }
}
