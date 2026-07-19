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

    const selectFormatContainer = document.createElement("div");
    selectFormatContainer.className = "input-group";
    
    selectFormatContainer.innerHTML = `<label><i class="fas fa-exchange-alt"></i> 出題形式：</label>
        <select id="formatSelect">
            <option value="">選択してください</option>
            <option value="en-ja">英語 → 日本語</option>
            <option value="ja-en">日本語 → 英語</option>
            <option value="random">ランダム</option>
        </select>`;
    subSettings.appendChild(selectFormatContainer);

    const formatSelect = document.getElementById("formatSelect");

    formatSelect.addEventListener("change", ()=>{
        const oldNext = document.getElementById("nextSelect");
        if(oldNext) oldNext.remove();
        if(!formatSelect.value) return;

        const nextDiv = document.createElement("div");
        nextDiv.id = "nextSelect";
        nextDiv.className = "input-group";

        if(mode==="memorize"){
            nextDiv.innerHTML = `<label><i class="fas fa-sort"></i> 順序：</label>
                <select id="orderSelect">
                    <option value="asc">昇順</option>
                    <option value="desc">降順</option>
                    <option value="random">ランダム</option>
                </select>`;
            subSettings.appendChild(nextDiv);

            const orderSelect = document.getElementById("orderSelect");
            const toggleNumInput = ()=>{ numQuestionsLabel.style.display = (orderSelect.value==="random")?"block":"none"; };
            orderSelect.addEventListener("change", toggleNumInput);
            toggleNumInput();
        } else {
            nextDiv.innerHTML = `<label><i class="fas fa-keyboard"></i> 回答方式：</label>
                <select id="answerTypeSelect">
                    <option value="input">自由入力</option>
                    <option value="choice">選択肢</option>
                </select>`;
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
    let endNum = parseInt(document.getElementById("endNumber").value) || 1900;
    let num = parseInt(document.getElementById("numQuestions").value) || 10;

    quizWords = words.filter(w=>w.number>=startNum && w.number<=endNum);

    let weakBox = mode==="memorize"?weakBoxMemorize:weakBoxTest;
    if(weakOnly.checked) quizWords = quizWords.filter(w=>weakBox.has(w.number));

    if(quizWords.length===0) return alert("範囲内に単語がありません。");

    // プレースホルダーを隠す
    document.getElementById("empty-state").style.display = "none";

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

        let isJaEn;
        if(format==="random") isJaEn = Math.random()<0.5;
        else isJaEn = format==="ja-en";

        const questionText = isJaEn?q.answer:q.question; 
        const answerText = isJaEn?q.question:q.answer;    

        let html = `<strong>Q${i+1}. ${questionText}</strong>`;

        if(answerType==="choice"){
            let options = generateChoices(q, isJaEn);
            options = shuffleArray(options);
            html += `<div style="display:flex; flex-wrap:wrap; gap:5px; justify-content:center; margin-bottom:10px;">`;
            options.forEach(opt=>html+=`<button class="btn-pop btn-pop-green choiceBtn">${opt}</button>`);
            html += `</div><div class="result"></div>`;
        } else {
            html+=`<div style="display:flex; gap:10px; margin-bottom:10px;">
                     <input type="text" class="userInput" placeholder="ここに入力">
                     <button class="btn-pop btn-pop-blue checkBtn"><i class="fas fa-check"></i></button>
                   </div>
                   <div class="result"></div>`;
        }

        // 苦手ボタン（右寄せ）
        html+=`<div style="text-align: right; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                  <button class="btn-pop btn-pop-orange weakBtn">
                      ${weakBox.has(q.number)?"苦手解除 <i class='fas fa-star'></i>":"苦手にする <i class='far fa-star'></i>"}
                  </button>
               </div>`;
        
        div.innerHTML = html;
        quizContainer.appendChild(div);

        // 苦手ボタン処理
        div.querySelector(".weakBtn").addEventListener("click", function(){
            if(weakBox.has(q.number)){
                weakBox.delete(q.number);
                this.innerHTML="苦手にする <i class='far fa-star'></i>";
            } else {
                weakBox.add(q.number);
                this.innerHTML="苦手解除 <i class='fas fa-star'></i>";
            }
        });

        // 選択肢ボタン処理
        const choiceBtns = div.querySelectorAll(".choiceBtn");
        choiceBtns.forEach(btn=>{
            btn.addEventListener("click", e=>{
                const correct = answerText;
                const ansDiv = div.querySelector(".result");
                
                choiceBtns.forEach(b => {
                    b.style.pointerEvents = "none";
                    b.style.opacity = 0.5;
                });
                e.target.style.opacity = 1;
                
                if(e.target.innerText===correct) {
                    ansDiv.innerHTML=`<span style="color:#388e3c;"><i class="far fa-circle"></i> 正解！</span>`;
                } else {
                    ansDiv.innerHTML=`<span style="color:#d32f2f;"><i class="fas fa-times"></i> 不正解！答え: ${correct}</span>`;
                }
            });
        });

        // 自由入力処理
        div.querySelectorAll(".checkBtn").forEach(btn=>{
            btn.addEventListener("click", e=>{
                const inputEl = div.querySelector(".userInput");
                const input = inputEl.value.trim();
                const ansDiv = div.querySelector(".result");
                
                if(input===answerText) {
                    ansDiv.innerHTML=`<span style="color:#388e3c;"><i class="far fa-circle"></i> 正解！</span>`;
                    inputEl.style.borderColor = "#388e3c";
                } else {
                    ansDiv.innerHTML=`<span style="color:#d32f2f;"><i class="fas fa-times"></i> 不正解！答え: ${answerText}</span>`;
                    inputEl.style.borderColor = "#d32f2f";
                }
            });
        });
    });
}

// 暗記モード
function startMemorizeMode(format, weakBox){
    document.getElementById("quiz").classList.add("hidden");
    document.getElementById("memorizeSection").classList.remove("hidden");
    memorizeBox.innerHTML="";

    quizWords.forEach((q,i)=>{
        const div = document.createElement("div");
        div.classList.add("questionItem");

        let isJaEn;
        if(format==="random") isJaEn = Math.random()<0.5;
        else isJaEn = format==="ja-en";

        const questionText = isJaEn?q.answer:q.question;
        const answerText = isJaEn?q.question:q.answer;

        div.innerHTML=`
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Q${i+1}. ${questionText}</strong>
                    <div style="margin-top:10px;">
                        <span class="answer" style="display:none;">${answerText}</span>
                    </div>
                </div>
                <button class="btn-pop btn-pop-orange weakBtn">
                    ${weakBox.has(q.number)?"苦手解除 <i class='fas fa-star'></i>":"苦手にする <i class='far fa-star'></i>"}
                </button>
            </div>
        `;
        memorizeBox.appendChild(div);

        // クリックで答え表示・非表示（ボタン以外をクリックした時）
        div.addEventListener("click", (e)=>{
            if(!e.target.closest('button')){
                const ans = div.querySelector(".answer");
                ans.style.display = ans.style.display==="none"?"inline-block":"none";
            }
        });

        // 苦手ボタン処理
        const btn = div.querySelector(".weakBtn");
        btn.addEventListener("click", ()=>{
            if(weakBox.has(q.number)){
                weakBox.delete(q.number);
                btn.innerHTML="苦手にする <i class='far fa-star'></i>";
            } else {
                weakBox.add(q.number);
                btn.innerHTML="苦手解除 <i class='fas fa-star'></i>";
            }
        });
    });
}

showAllBtn.addEventListener("click", ()=>memorizeBox.querySelectorAll(".answer").forEach(el=>el.style.display="inline-block"));
hideAllBtn.addEventListener("click", ()=>memorizeBox.querySelectorAll(".answer").forEach(el=>el.style.display="none"));

// 選択肢生成関数
function generateChoices(correctWord, isJaEn){
    let pool = isJaEn? words.map(w=>w.question) : words.map(w=>w.answer);
    pool = pool.filter(x=>x!== (isJaEn?correctWord.question:correctWord.answer));
    pool = shuffleArray(pool).slice(0,3);
    pool.push(isJaEn?correctWord.question:correctWord.answer);
    return pool;
}
