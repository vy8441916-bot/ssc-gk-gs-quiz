/* Quiz engine — vanilla JS, no dependencies. */
(function () {
  'use strict';

  var TELEGRAM = 'https://t.me/sscgkgs0';
  var KEYS = ['A', 'B', 'C', 'D'];

  var root = document.querySelector('[data-quiz]');
  if (!root) return;

  var stage = root.querySelector('.quiz-stage');
  var startWrap = root.querySelector('.quiz-start');
  var sourceEl = root.querySelector('[data-quiz-source]');
  var countEl = root.querySelector('[data-quiz-count]');
  var form = root.querySelector('[data-quiz-form]');
  var defaultSource = root.getAttribute('data-source');
  var defaultCount = parseInt(root.getAttribute('data-count') || '20', 10);
  var label = root.getAttribute('data-label') || 'Practice set';

  var state = { questions: [], index: 0, score: 0, answers: [], locked: false, nodes: {} };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function showError() {
    stage.hidden = false;
    startWrap.hidden = true;
    stage.innerHTML = '';
    var box = el('div', 'notice');
    box.appendChild(el('p', '', 'The questions could not be loaded. Please check your connection and try again.'));
    var p = el('p');
    var retry = el('button', 'btn btn-primary', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', function () { startWrap.hidden = false; stage.hidden = true; });
    var tg = el('a', '', 'Practise on Telegram');
    tg.href = TELEGRAM;
    tg.rel = 'noopener';
    tg.target = '_blank';
    p.appendChild(retry);
    p.appendChild(document.createTextNode(' '));
    p.appendChild(tg);
    box.appendChild(p);
    stage.appendChild(box);
  }

  function start() {
    var url = sourceEl ? sourceEl.value : defaultSource;
    var count = countEl ? parseInt(countEl.value, 10) : defaultCount;
    stage.hidden = false;
    startWrap.hidden = true;
    stage.innerHTML = '';
    stage.appendChild(el('p', 'quiz-meta', 'Loading questions…'));

    fetch(url, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) throw new Error('No questions');
        var picked = shuffle(data).slice(0, count).map(function (row) {
          return { q: row[0], options: row[1], answer: row[2], explanation: row[3] };
        });
        state.questions = picked;
        state.index = 0;
        state.score = 0;
        state.answers = [];
        render();
      })
      .catch(showError);
  }

  function render() {
    state.locked = false;
    var q = state.questions[state.index];
    stage.innerHTML = '';

    var head = el('div', 'q-head');
    head.appendChild(el('span', '', label + ' · Question ' + (state.index + 1) + ' of ' + state.questions.length));
    head.appendChild(el('span', '', 'Score: ' + state.score));
    stage.appendChild(head);

    var progress = el('div', 'progress');
    var bar = el('div', 'progress-bar');
    bar.style.width = ((state.index) / state.questions.length * 100) + '%';
    progress.appendChild(bar);
    stage.appendChild(progress);

    stage.appendChild(el('p', 'q-text', q.q));

    var list = el('ul', 'opts');
    q.options.forEach(function (option, i) {
      var li = el('li');
      var btn = el('button', 'opt');
      btn.type = 'button';
      btn.appendChild(el('span', 'opt-key', KEYS[i]));
      btn.appendChild(el('span', 'opt-label', option));
      btn.addEventListener('click', function () { answer(i); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    stage.appendChild(list);

    var feedback = el('div', 'feedback');
    feedback.hidden = true;
    feedback.setAttribute('aria-live', 'polite');
    stage.appendChild(feedback);

    var actions = el('div', 'quiz-actions');
    actions.hidden = true;
    stage.appendChild(actions);

    state.nodes = { list: list, feedback: feedback, actions: actions, bar: bar };
  }

  function answer(choice) {
    if (state.locked) return;
    state.locked = true;
    var q = state.questions[state.index];
    var correct = choice === q.answer;
    if (correct) state.score += 1;
    state.answers.push({ q: q.q, choice: choice, answer: q.answer, options: q.options });

    var buttons = state.nodes.list.querySelectorAll('.opt');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (i === q.answer) buttons[i].classList.add('is-correct');
      if (i === choice && !correct) buttons[i].classList.add('is-wrong');
    }

    var fb = state.nodes.feedback;
    fb.hidden = false;
    fb.innerHTML = '';
    fb.className = 'feedback ' + (correct ? 'is-ok' : 'is-no');
    fb.appendChild(el('p', 'fb-verdict', correct ? 'Correct.' :
      'Not quite. The correct answer is ' + KEYS[q.answer] + ': ' + q.options[q.answer]));
    if (q.explanation) fb.appendChild(el('p', '', 'Explanation: ' + q.explanation));

    state.nodes.bar.style.width = ((state.index + 1) / state.questions.length * 100) + '%';

    var actions = state.nodes.actions;
    actions.hidden = false;
    actions.innerHTML = '';
    var last = state.index === state.questions.length - 1;
    var next = el('button', 'btn btn-primary', last ? 'See result' : 'Next question');
    next.type = 'button';
    next.addEventListener('click', function () {
      if (last) { finish(); } else { state.index += 1; render(); }
    });
    actions.appendChild(next);
    next.focus();
  }

  function finish() {
    var total = state.questions.length;
    var pct = Math.round(state.score / total * 100);
    stage.innerHTML = '';

    var box = el('div', 'result');
    box.appendChild(el('p', 'result-score', state.score + ' / ' + total));
    box.appendChild(el('p', 'result-line', 'Accuracy ' + pct + '% · ' +
      (pct >= 80 ? 'Strong recall — keep the streak going.' :
       pct >= 50 ? 'A fair base. Read the explanations you missed and retry.' :
       'Start with the explanations, then attempt a shorter set.')));

    var actions = el('div', 'quiz-actions');
    actions.style.justifyContent = 'center';
    var again = el('button', 'btn btn-primary', 'Try another set');
    again.type = 'button';
    again.addEventListener('click', function () {
      if (form) { stage.hidden = true; startWrap.hidden = false; start(); }
      else { start(); }
    });
    var tg = el('a', 'btn btn-tg', 'Join Telegram for daily questions');
    tg.href = TELEGRAM;
    tg.rel = 'noopener';
    tg.target = '_blank';
    actions.appendChild(again);
    actions.appendChild(tg);
    box.appendChild(actions);

    var wrong = state.answers.filter(function (a) { return a.choice !== a.answer; });
    if (wrong.length) {
      box.appendChild(el('h3', '', 'Review the ones you missed'));
      var ul = el('ul', 'review');
      wrong.forEach(function (a) {
        var li = el('li');
        li.appendChild(el('span', 'rv-q', a.q));
        li.appendChild(el('span', 'rv-b', 'Your answer: ' + a.options[a.choice]));
        li.appendChild(document.createElement('br'));
        li.appendChild(el('span', 'rv-a', 'Correct answer: ' + a.options[a.answer]));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    stage.appendChild(box);
    var heading = stage.querySelector('.result-score');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
  }

  var startBtn = root.querySelector('[data-quiz-start]');
  if (startBtn) startBtn.addEventListener('click', start);
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      start();
    });
  }
})();
