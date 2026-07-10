let words = [];
let quizWords = [];
let weakBoxTest = new Set();
let weakBoxMemorize = new Set();

fetch("words.json")
    .then(res => res.json())
    .then(data => words = data)
    .catch(err => console.error(err));

const mainMode = document.getElementById("mainMode");
const subSettings = document.getElementById("subSettings");
const startBtn = document.getElementById("startBtn");
const quizContainer = document.getElementById("quizContainer");
const memorizeBox = document.getElementById("memorizeBox");
const showAllBtn = document.getElementById("showAllBtn");
const hideAllBtn = document.getElementById("hideAllBtn");
const weakOnly = document.getElementById("weakOnly");
const rangeSection = document.getElementById("rangeSection");
const numQuestionsLabel = document.getElementById("numQuestionsLabel");

mainMode.addEventListener("change", ()=>{
    subSettings.innerHTML = "";
    const mode = mainMode.value;
    if(!mode) return;

    const selectFormat = document.createElement("select");
    selectFormat.id = "formatSelect";
    selectFormat.innerHTML = `<option value="">出題形式選択</option>
        <option value="en-ja">英語→日本語</option>
        <option value="ja-en">日本語→英語</option>
        <option value="random">ランダム</option>`;
    subSettings.appendChild(selectFormat);

    selectFormat.addEventListener("change", ()=>{
        const oldNext = document.getElementById("nextSelect");
        if(oldNext) oldNext.remove();
        if(!selectFormat.value) return;

        const nextDiv = document.createElement("div");
        nextDiv.id = "nextSelect";

        if(mode==="memorize"){
            nextDiv.innerHTML = `<label>順序:
                <select id="orderSelect">
                    <option value="asc">昇順</option>
                    <option value="desc">降順</option>
                    <option value="random">ランダム</option>
                </select>
            </label>`;
            subSettings.appendChild(nextDiv);

            const orderSelect = document.getElementById("orderSelect");
            const toggleNumInput = ()=>{ numQuestionsLabel.style.display = (orderSelect.value==="random")?"block":"none"; };
            orderSelect.addEventListener("change", toggleNumInput);
            toggleNumInput();
        } else {
            nextDiv.innerHTML = `<label>回答方式:
                <select id="answerTypeSelect">
                    <option value="input">自由入力</option>
                    <option value="choice">選択肢</option>
                </select>
            </label>`;
            subSettings.appendChild(nextDiv);
            numQuestionsLabel.style.display="block";
        }
    });
});

startBtn.addEventListener("click", ()=>{
    const mode = mainMode.value;
    const format = document.getElementById("formatSelect")?.value;
    if(!mode || !format) return alert("モードと出題形式を選択してください。");

    const order = mode==="memorize"?document.getElementById("orderSelect")?.value || "random":"random";
    const answerType = mode==="test"?document.getElementById("answerTypeSelect")?.value || "input":"input";

    let startNum = parseInt(document.getElementById("startNumber").value) || 1;
    let endNum = parseInt(document.getElementById("endNumber").value) || 10;
    let num = parseInt(document.getElementById("numQuestions").value) || 10;

    quizWords = words.filter(w=>w.number>=startNum && w.number<=endNum);

    let weakBox = mode==="memorize"?weakBoxMemorize:weakBoxTest;
    if(weakOnly.checked) quizWords = quizWords.filter(w=>weakBox.has(w.number));

    if(quizWords.length===0) return alert("範囲内に単語がありません。");

    if(mode==="memorize"){
        if(order==="asc") quizWords = quizWords.slice().sort((a,b)=>a.number-b.number);
        else if(order==="desc") quizWords = quizWords.slice().sort((a,b)=>b.number-a.number);
        else quizWords = shuffleArray(quizWords.slice());

        if(order!=="random") num = quizWords.length;
        quizWords = quizWords.slice(0,num);
        startMemorizeMode(format, weakBox);
    } else {
        quizWords = shuffleArray(quizWords.slice());
        if(num>quizWords.length) num=quizWords.length;
        quizWords = quizWords.slice(0,num);
        startNormalMode(format, answerType, weakBox);
    }
});

function shuffleArray(arr){return arr.sort(()=>Math.random()-0.5);}

// 通常モード（テストモード）
function startNormalMode(format, answerType, weakBox){
    document.getElementById("quiz").classList.remove("hidden");
    document.getElementById("memorizeSection").classList.add("hidden");
    quizContainer.innerHTML="";

    quizWords.forEach((q,i)=>{
        const div = document.createElement("div");
        div.classList.add("questionItem");

        // 出題言語と答えの設定
        let isJaEn;
        if(format==="random") isJaEn = Math.random()<0.5;
        else isJaEn = format==="ja-en";

        const questionText = isJaEn?q.answer:q.question;  // 問題
        const answerText = isJaEn?q.question:q.answer;    // 正解

        let html = `<strong>${q.number}. ${questionText}</strong><br>`;

        if(answerType==="choice"){
            let options = generateChoices(q, isJaEn);
            options = shuffleArray(options);
            options.forEach(opt=>html+=`<button class="choiceBtn">${opt}</button> `);
            html+=`<div class="result"></div>`;
        } else {
            html+=`<input type="text" class="userInput" placeholder="ここに入力">
                   <button class="checkBtn">答え合わせ</button>
                   <div class="result"></div>`;
        }

        html+=`<button class="weakBtn">${weakBox.has(q.number)?"苦手解除":"苦手にする"}</button>`;
        div.innerHTML = html;
        quizContainer.appendChild(div);

        // 苦手ボタン
        div.querySelector(".weakBtn").addEventListener("click", ()=>{
            if(weakBox.has(q.number)){
                weakBox.delete(q.number);
                div.querySelector(".weakBtn").innerText="苦手にする";
            } else {
                weakBox.add(q.number);
                div.querySelector(".weakBtn").innerText="苦手解除";
            }
        });

        // 選択肢ボタン
        const choiceBtns = div.querySelectorAll(".choiceBtn");
        choiceBtns.forEach(btn=>{
            btn.addEventListener("click", e=>{
                const correct = answerText;
                const ansDiv = div.querySelector(".result");
                choiceBtns.forEach(b=>b.style.opacity=0.6);
                e.target.style.opacity = 1;
                if(e.target.innerText===correct) ansDiv.innerHTML=`<span style="color:green;">正解！</span>`;
                else ansDiv.innerHTML=`<span style="color:red;">不正解！あなた: ${e.target.innerText} 答え: ${correct}</span>`;
            });
        });

        // 自由入力
        div.querySelectorAll(".checkBtn").forEach(btn=>{
            btn.addEventListener("click", e=>{
                const input = div.querySelector(".userInput").value.trim();
                const ansDiv = div.querySelector(".result");
                if(input===answerText) ansDiv.innerHTML=`<span style="color:green;">正解！</span>`;
                else ansDiv.innerHTML=`<span style="color:red;">不正解！あなた: ${input} 答え: ${answerText}</span>`;
            });
        });
    });
}

// 暗記モード
function startMemorizeMode(format, weakBox){
    document.getElementById("quiz").classList.add("hidden");
    document.getElementById("memorizeSection").classList.remove("hidden");
    memorizeBox.innerHTML="";

    quizWords.forEach(q=>{
        const div = document.createElement("div");
        div.classList.add("questionItem");

        let isJaEn;
        if(format==="random") isJaEn = Math.random()<0.5;
        else isJaEn = format==="ja-en";

        const questionText = isJaEn?q.answer:q.question;
        const answerText = isJaEn?q.question:q.answer;

        div.innerHTML=`<strong>${q.number}. ${questionText}</strong>: <span class="answer" style="display:none;">${answerText}</span>`;
        memorizeBox.appendChild(div);

        div.addEventListener("click", (e)=>{
            if(e.target.tagName!=="BUTTON"){
                const ans = div.querySelector(".answer");
                ans.style.display = ans.style.display==="none"?"inline":"none";
            }
        });

        const btn = document.createElement("button");
        btn.innerText = weakBox.has(q.number)?"苦手解除":"苦手にする";
        btn.classList.add("weakBtn");
        btn.addEventListener("click", (e)=>{
            if(weakBox.has(q.number)){
                weakBox.delete(q.number);
                btn.innerText="苦手にする";
            } else {
                weakBox.add(q.number);
                btn.innerText="苦手解除";
            }
        });
        div.appendChild(btn);
    });
}

showAllBtn.addEventListener("click", ()=>memorizeBox.querySelectorAll(".answer").forEach(el=>el.style.display="inline"));
hideAllBtn.addEventListener("click", ()=>memorizeBox.querySelectorAll(".answer").forEach(el=>el.style.display="none"));

// 選択肢生成関数
function generateChoices(correctWord, isJaEn){
    // 問題が英語なら答えは日本語から、問題が日本語なら答えは英語から
    let pool = isJaEn? words.map(w=>w.question) : words.map(w=>w.answer);
    pool = pool.filter(x=>x!== (isJaEn?correctWord.question:correctWord.answer));
    pool = shuffleArray(pool).slice(0,3);
    pool.push(isJaEn?correctWord.question:correctWord.answer);
    return pool;
}
