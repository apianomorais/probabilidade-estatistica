/* ===================================================================
   widgets.js — simuladores e calculadoras interativas
   Uso nas páginas: <div data-widget="nome"></div>
   Probabilidade & Estatística / LFCA–URCA
   =================================================================== */

(function () {
  'use strict';

  /* ---------- utilitários de DOM ---------- */
  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'texto') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function moldura(raiz, titulo) {
    raiz.classList.add('widget');
    var cab = el('div', { class: 'widget-cabeca', texto: titulo });
    var corpo = el('div', { class: 'widget-corpo' });
    raiz.appendChild(cab); raiz.appendChild(corpo);
    return corpo;
  }

  function deslizante(pai, rot, min, max, passo, inicial, aoMudar, formata) {
    var campo = el('div', { class: 'campo' });
    var lab = el('label');
    var val = el('span', { class: 'valor' });
    var inp = el('input', { type: 'range', min: min, max: max, step: passo, value: inicial });
    function mostrar() {
      val.innerHTML = formata ? formata(Number(inp.value)) : inp.value.replace('.', ',');
    }
    lab.innerHTML = rot + ' ';
    lab.appendChild(val);
    campo.appendChild(lab); campo.appendChild(inp);
    pai.appendChild(campo);
    inp.addEventListener('input', function () { mostrar(); aoMudar(Number(inp.value)); });
    mostrar();
    return inp;
  }

  function numero(pai, rot, inicial, aoMudar, attrs) {
    var campo = el('div', { class: 'campo' });
    campo.appendChild(el('label', { html: rot }));
    var a = Object.assign({ type: 'number', value: inicial, step: 'any' }, attrs || {});
    var inp = el('input', a);
    campo.appendChild(inp); pai.appendChild(campo);
    inp.addEventListener('input', aoMudar);
    return inp;
  }

  function botao(pai, rot, aoClicar, secundario) {
    var b = el('button', { class: secundario ? 'sec' : '', texto: rot });
    b.addEventListener('click', aoClicar);
    pai.appendChild(b);
    return b;
  }

  function cartoes(pai, lista) {
    var g = el('div', { class: 'grade-num' });
    lista.forEach(function (c) {
      g.appendChild(el('div', { class: 'cartao-num', html:
        '<span class="rot">' + c.rot + '</span><span class="val" data-k="' + c.k + '">—</span>' }));
    });
    pai.appendChild(g);
    return function (vals) {
      Object.keys(vals).forEach(function (k) {
        var n = g.querySelector('[data-k="' + k + '"]');
        if (n) n.innerHTML = vals[k];
      });
    };
  }

  /* =================================================================
     1. Simulador de dois dados
     ================================================================= */
  function dadosDois(raiz) {
    var c = moldura(raiz, 'Simulador: soma de dois dados');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda',
      html: 'Barras: frequência relativa observada &nbsp;•&nbsp; Linha vermelha: probabilidade teórica' }));
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var cont = {}, total = 0;
    for (var s = 2; s <= 12; s++) cont[s] = 0;
    var teo = {};
    for (var k = 2; k <= 12; k++) teo[k] = (6 - Math.abs(k - 7)) / 36;

    function lancar(n) {
      for (var i = 0; i < n; i++) {
        var a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
        cont[a + b]++; total++;
      }
      desenhar();
    }

    function zerar() {
      for (var s = 2; s <= 12; s++) cont[s] = 0;
      total = 0; desenhar();
    }

    function desenhar() {
      var ymax = 0.22;
      for (var s = 2; s <= 12; s++)
        if (total > 0) ymax = Math.max(ymax, cont[s] / total * 1.15);
      var g = G.eixos(cv, {
        xmin: 1.4, xmax: 12.6, ymax: ymax, altura: 260,
        rotX: 'soma dos dois dados', rotY: 'probabilidade',
        marcasX: G.marcasInteiras(2, 12, 11),
        formataY: function (v) { return (100 * v).toFixed(0) + '%'; }
      });
      var dados = [];
      for (var i = 2; i <= 12; i++) dados.push({ x: i, y: total ? cont[i] / total : 0 });
      G.barras(g, dados, G.COR.azulClaro, 0.72);
      // teórica
      var pontos = [];
      for (var j = 2; j <= 12; j++) pontos.push({ x: j, y: teo[j] });
      var ct = g.ct;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2; ct.beginPath();
      pontos.forEach(function (p, idx) {
        var px = g.X(p.x), py = g.Y(p.y);
        if (idx === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
      });
      ct.stroke();
      pontos.forEach(function (p) {
        ct.fillStyle = G.COR.vinho;
        ct.beginPath(); ct.arc(g.X(p.x), g.Y(p.y), 3.2, 0, 2 * Math.PI); ct.fill();
      });

      var maiorDesvio = 0;
      for (var q = 2; q <= 12; q++)
        if (total) maiorDesvio = Math.max(maiorDesvio, Math.abs(cont[q] / total - teo[q]));
      saida.innerHTML = total === 0
        ? 'Nenhum lançamento ainda. Clique em um dos botões para começar.'
        : '<b>' + total.toLocaleString('pt-BR') + '</b> lançamentos. '
          + 'Soma 7 observada: <b>' + M.pct(cont[7] / total) + '</b> '
          + '(teórica: 16,67%). Maior desvio entre observado e teórico: <b>'
          + M.pct(maiorDesvio) + '</b>.';
    }

    botao(bts, '+1 lançamento', function () { lancar(1); });
    botao(bts, '+100', function () { lancar(100); });
    botao(bts, '+10 000', function () { lancar(10000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     2. Álgebra de eventos (diagrama de Venn)
     ================================================================= */
  function eventos(raiz) {
    var c = moldura(raiz, 'Calculadora: união, interseção e complementar');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var iA, iB, iAB;
    function ler() { atualizar(); }
    iA = numero(ctr, 'P(A)', 0.6, ler, { min: 0, max: 1, step: 0.05 });
    iB = numero(ctr, 'P(B)', 0.5, ler, { min: 0, max: 1, step: 0.05 });
    iAB = numero(ctr, 'P(A∩B)', 0.3, ler, { min: 0, max: 1, step: 0.05 });

    var cv = el('canvas'); c.appendChild(cv);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);
    var painel = cartoes(c, [
      { rot: 'P(A∪B)', k: 'u' }, { rot: 'só A', k: 'sa' },
      { rot: 'só B', k: 'sb' }, { rot: 'nem A nem B', k: 'n' }
    ]);

    function atualizar() {
      var pa = Number(iA.value), pb = Number(iB.value), pab = Number(iAB.value);
      var erro = null;
      if (pa < 0 || pa > 1 || pb < 0 || pb > 1 || pab < 0 || pab > 1)
        erro = 'Toda probabilidade deve estar entre 0 e 1.';
      else if (pab > Math.min(pa, pb))
        erro = 'Impossível: P(A∩B) não pode exceder P(A) nem P(B), pois A∩B ⊆ A e A∩B ⊆ B.';
      else if (pa + pb - pab > 1 + 1e-9)
        erro = 'Impossível: P(A∪B) = P(A)+P(B)−P(A∩B) resultaria maior que 1.';

      var u = pa + pb - pab, sa = pa - pab, sb = pb - pab, n = 1 - u;
      painel({ u: erro ? '—' : M.fmt(u, 3), sa: erro ? '—' : M.fmt(sa, 3),
               sb: erro ? '—' : M.fmt(sb, 3), n: erro ? '—' : M.fmt(n, 3) });

      saida.innerHTML = erro
        ? '<b style="color:#8c2f39">' + erro + '</b>'
        : 'P(A∪B) = ' + M.fmt(pa, 2) + ' + ' + M.fmt(pb, 2) + ' − ' + M.fmt(pab, 2)
          + ' = <b>' + M.fmt(u, 3) + '</b>. &nbsp; '
          + (Math.abs(pab - pa * pb) < 1e-9
             ? 'Como P(A∩B) = P(A)·P(B), os eventos são <b>independentes</b>.'
             : (pab === 0 ? 'Como P(A∩B) = 0, os eventos são <b>mutuamente exclusivos</b>.'
                          : 'Os eventos <b>não</b> são independentes nem exclusivos.'));
      desenhar(erro ? null : { pa: pa, pb: pb, pab: pab, sa: sa, sb: sb, n: n, u: u });
    }

    function desenhar(d) {
      var p = G.preparar(cv, 230), ct = p.ct, L = p.L, A = p.A;
      ct.fillStyle = '#f6f7f9';
      ct.fillRect(10, 10, L - 20, A - 20);
      ct.strokeStyle = '#9aa6b2'; ct.lineWidth = 1;
      ct.strokeRect(10, 10, L - 20, A - 20);
      ct.font = '12px system-ui, sans-serif'; ct.fillStyle = '#5b6773';
      ct.textAlign = 'left'; ct.textBaseline = 'top';
      ct.fillText('Ω', 16, 15);
      if (!d) return;
      var cx = L / 2, cy = A / 2, r = Math.min(A * 0.33, L * 0.19);
      var desl = d.pab === 0 ? r * 1.15 : r * (1.05 - 0.85 * (d.pab / Math.min(d.pa, d.pb) || 0));
      desl = Math.max(r * 0.15, Math.min(r * 1.2, desl));
      ct.globalAlpha = 0.52;
      ct.fillStyle = '#2c5f8d';
      ct.beginPath(); ct.arc(cx - desl, cy, r, 0, 2 * Math.PI); ct.fill();
      ct.fillStyle = '#b5831f';
      ct.beginPath(); ct.arc(cx + desl, cy, r, 0, 2 * Math.PI); ct.fill();
      ct.globalAlpha = 1;
      ct.strokeStyle = '#16304f'; ct.lineWidth = 1.4;
      ct.beginPath(); ct.arc(cx - desl, cy, r, 0, 2 * Math.PI); ct.stroke();
      ct.beginPath(); ct.arc(cx + desl, cy, r, 0, 2 * Math.PI); ct.stroke();
      ct.fillStyle = '#16304f'; ct.font = '600 15px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'middle';
      ct.fillText('A', cx - desl - r * 0.55, cy - r * 0.68);
      ct.fillText('B', cx + desl + r * 0.55, cy - r * 0.68);
      ct.font = '12px system-ui, sans-serif'; ct.fillStyle = '#1b1f24';
      ct.fillText(M.fmt(d.sa, 2), cx - desl - r * 0.42, cy);
      ct.fillText(M.fmt(d.sb, 2), cx + desl + r * 0.42, cy);
      if (desl < r) ct.fillText(M.fmt(d.pab, 2), cx, cy);
      ct.fillStyle = '#5b6773';
      ct.fillText('fora: ' + M.fmt(d.n, 2), cx, A - 24);
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     3. Probabilidade geométrica — problema do encontro
     ================================================================= */
  function encontro(raiz) {
    var c = moldura(raiz, 'Monte Carlo: o problema do encontro');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var tol = 15;
    deslizante(ctr, 'Tolerância de espera', 1, 60, 1, 15, function (v) {
      tol = v; zerar();
    }, function (v) { return v + ' min'; });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda',
      html: 'Cada ponto é um par (chegada de A, chegada de B). Verde = encontraram-se.' }));
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var pontos = [], acertos = 0;

    function sortear(n) {
      for (var i = 0; i < n; i++) {
        var x = Math.random(), y = Math.random();
        var ok = Math.abs(x - y) <= tol / 60;
        if (ok) acertos++;
        if (pontos.length < 4000) pontos.push({ x: x, y: y, ok: ok });
        else { pontos[Math.floor(Math.random() * 4000)] = { x: x, y: y, ok: ok }; }
      }
      totalSorteios += n;
      desenhar();
    }
    var totalSorteios = 0;

    function zerar() { pontos = []; acertos = 0; totalSorteios = 0; desenhar(); }

    function desenhar() {
      var p = G.preparar(cv, 300), ct = p.ct;
      var lado = Math.min(p.A - 40, p.L - 40);
      var ox = (p.L - lado) / 2, oy = 20;
      function PX(v) { return ox + v * lado; }
      function PY(v) { return oy + (1 - v) * lado; }

      // faixa favorável
      var t = tol / 60;
      ct.fillStyle = 'rgba(31,111,84,.14)';
      ct.beginPath();
      ct.moveTo(PX(0), PY(0)); ct.lineTo(PX(0), PY(Math.min(1, t)));
      ct.lineTo(PX(Math.max(0, 1 - t)), PY(1)); ct.lineTo(PX(1), PY(1));
      ct.lineTo(PX(1), PY(Math.max(0, 1 - t))); ct.lineTo(PX(Math.min(1, t)), PY(0));
      ct.closePath(); ct.fill();

      ct.strokeStyle = '#9aa6b2'; ct.lineWidth = 1;
      ct.strokeRect(PX(0), PY(1), lado, lado);
      ct.strokeStyle = '#c9d2db'; ct.setLineDash([4, 4]);
      ct.beginPath(); ct.moveTo(PX(0), PY(0)); ct.lineTo(PX(1), PY(1)); ct.stroke();
      ct.setLineDash([]);

      pontos.forEach(function (q) {
        ct.fillStyle = q.ok ? 'rgba(31,111,84,.72)' : 'rgba(140,47,57,.38)';
        ct.fillRect(PX(q.x) - 1.2, PY(q.y) - 1.2, 2.4, 2.4);
      });

      ct.fillStyle = '#5b6773'; ct.font = '11px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      ct.fillText('chegada de A (0 → 60 min)', PX(0.5), PY(0) + 7);
      ct.save(); ct.translate(PX(0) - 10, PY(0.5)); ct.rotate(-Math.PI / 2);
      ct.textBaseline = 'bottom'; ct.fillText('chegada de B', 0, 0); ct.restore();

      var teorico = 1 - Math.pow(1 - t, 2);
      saida.innerHTML = totalSorteios === 0
        ? 'Valor teórico com tolerância de ' + tol + ' min: <b>' + M.pct(teorico)
          + '</b> &nbsp;(fórmula: \\(1-(1-\\tau)^2\\)). Sorteie pontos para comparar.'
        : 'Simulados <b>' + totalSorteios.toLocaleString('pt-BR') + '</b> encontros. '
          + 'Frequência observada: <b>' + M.pct(acertos / totalSorteios) + '</b> &nbsp;|&nbsp; '
          + 'valor teórico \\(1-(1-\\tau)^2\\) = <b>' + M.pct(teorico) + '</b>.';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    botao(bts, '+500 pontos', function () { sortear(500); });
    botao(bts, '+20 000', function () { sortear(20000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     4. Técnicas de contagem
     ================================================================= */
  function contagem(raiz) {
    var c = moldura(raiz, 'Calculadora: permutação, arranjo e combinação');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var iN = numero(ctr, 'n (total de objetos)', 5, atualizar, { min: 0, max: 170, step: 1 });
    var iK = numero(ctr, 'k (quantos escolher)', 3, atualizar, { min: 0, max: 170, step: 1 });

    var painel = cartoes(c, [
      { rot: 'Permutação P<sub>n</sub> = n!', k: 'p' },
      { rot: 'Arranjo A<sub>n,k</sub>', k: 'a' },
      { rot: 'Combinação C<sub>n,k</sub>', k: 'c' },
      { rot: 'Com repetição n<sup>k</sup>', k: 'r' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);
    var lista = el('div', { class: 'lista-rolavel' }); c.appendChild(lista);

    function fmtInt(x) {
      if (!isFinite(x)) return '∞';
      if (x > 1e15) return M.fmt(x, 3);
      return Math.round(x).toLocaleString('pt-BR');
    }

    function atualizar() {
      var n = Math.max(0, Math.floor(Number(iN.value) || 0));
      var k = Math.max(0, Math.floor(Number(iK.value) || 0));
      var val = k <= n;
      painel({
        p: fmtInt(n < 171 ? M.fatorial(n) : Math.exp(M.lnFatorial(n))),
        a: val ? fmtInt(M.arranjo(n, k)) : '0',
        c: val ? fmtInt(M.binom(n, k)) : '0',
        r: fmtInt(Math.pow(n, k))
      });

      saida.innerHTML = !val
        ? '<b style="color:#8c2f39">k &gt; n:</b> não há como escolher ' + k
          + ' objetos distintos entre apenas ' + n + '. Arranjo e combinação valem zero.'
        : 'Com <b>n = ' + n + '</b> e <b>k = ' + k + '</b>: há ' + fmtInt(M.arranjo(n, k))
          + ' sequências <b>ordenadas</b> de ' + k + ' objetos distintos, mas apenas '
          + fmtInt(M.binom(n, k)) + ' <b>subconjuntos</b> — cada subconjunto foi contado '
          + fmtInt(M.fatorial(k)) + ' vezes (= ' + k + '!) no arranjo.';

      // listagem explícita para casos pequenos
      lista.innerHTML = '';
      if (val && n <= 8 && k <= n && M.binom(n, k) <= 70) {
        var letras = 'ABCDEFGH'.slice(0, n).split('');
        var combos = [];
        (function gerar(inicio, atual) {
          if (atual.length === k) { combos.push(atual.slice()); return; }
          for (var i = inicio; i < n; i++) { atual.push(letras[i]); gerar(i + 1, atual); atual.pop(); }
        })(0, []);
        lista.innerHTML = '<b>As ' + combos.length + ' combinações de {' + letras.join(', ')
          + '} tomadas ' + k + ' a ' + k + ':</b><br>'
          + combos.map(function (x) { return '{' + x.join('') + '}'; }).join('&nbsp; ');
      } else {
        lista.innerHTML = '<span style="color:#5b6773">A listagem explícita aparece quando '
          + 'n ≤ 8 e há no máximo 70 combinações — reduza n ou k para vê-la.</span>';
      }
    }
    atualizar();
  }

  /* =================================================================
     5. Teorema de Bayes com frequências naturais
     ================================================================= */
  function bayes(raiz) {
    var c = moldura(raiz, 'Calculadora de Bayes e frequências naturais');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var iPrev = numero(ctr, 'Prevalência P(D) em %', 1, atualizar, { min: 0, max: 100, step: 0.1 });
    var iSens = numero(ctr, 'Sensibilidade P(+|D) em %', 99, atualizar, { min: 0, max: 100, step: 0.1 });
    var iEsp = numero(ctr, 'Especificidade P(−|Dᶜ) em %', 95, atualizar, { min: 0, max: 100, step: 0.1 });
    var iPop = numero(ctr, 'População', 100000, atualizar, { min: 100, max: 10000000, step: 100 });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'P(D|+) valor preditivo +', k: 'vpp' },
      { rot: 'P(Dᶜ|−) valor preditivo −', k: 'vpn' },
      { rot: 'P(+) testes positivos', k: 'ppos' },
      { rot: 'falsos +/verdadeiros +', k: 'raz' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var pr = Number(iPrev.value) / 100, se = Number(iSens.value) / 100,
          es = Number(iEsp.value) / 100, N = Math.max(100, Number(iPop.value) || 100000);
      var doentes = N * pr, sadios = N - doentes;
      var vp = doentes * se, fn = doentes - vp;
      var vn = sadios * es, fp = sadios - vn;
      var pos = vp + fp, neg = vn + fn;
      var vpp = pos > 0 ? vp / pos : 0, vpn = neg > 0 ? vn / neg : 0;

      painel({
        vpp: M.pct(vpp), vpn: M.pct(vpn), ppos: M.pct(pos / N),
        raz: vp > 0 ? M.fmt(fp / vp, 2) : '—'
      });

      saida.innerHTML =
        'Em <b>' + Math.round(N).toLocaleString('pt-BR') + '</b> pessoas: '
        + '<b>' + Math.round(doentes).toLocaleString('pt-BR') + '</b> têm a doença, das quais '
        + '<b>' + Math.round(vp).toLocaleString('pt-BR') + '</b> testam positivo (verdadeiros positivos); '
        + 'entre as <b>' + Math.round(sadios).toLocaleString('pt-BR') + '</b> saudáveis, '
        + '<b>' + Math.round(fp).toLocaleString('pt-BR') + '</b> testam positivo por engano. '
        + 'Logo, de cada <b>' + Math.round(pos).toLocaleString('pt-BR') + '</b> positivos, apenas '
        + '<b>' + M.pct(vpp) + '</b> estão de fato doentes.';

      desenhar(vp, fp, vn, fn, N);
    }

    function desenhar(vp, fp, vn, fn, N) {
      var p = G.preparar(cv, 150), ct = p.ct, L = p.L;
      var x0 = 14, w = L - 28, y = 36, h = 52;
      var tot = N, pos = vp + fp;
      var wPos = w * (pos / tot);
      // positivos
      ct.fillStyle = '#8c2f39';
      ct.fillRect(x0, y, w * (vp / tot), h);
      ct.fillStyle = '#d9a3a8';
      ct.fillRect(x0 + w * (vp / tot), y, w * (fp / tot), h);
      // negativos
      ct.fillStyle = '#a9c4d8';
      ct.fillRect(x0 + wPos, y, w * (fn / tot), h);
      ct.fillStyle = '#2c5f8d';
      ct.fillRect(x0 + wPos + w * (fn / tot), y, w * (vn / tot), h);
      ct.strokeStyle = '#ffffff'; ct.lineWidth = 2;
      ct.beginPath(); ct.moveTo(x0 + wPos, y - 6); ct.lineTo(x0 + wPos, y + h + 6); ct.stroke();

      ct.font = '600 11px system-ui, sans-serif'; ct.fillStyle = '#1b1f24';
      ct.textAlign = 'left'; ct.textBaseline = 'bottom';
      ct.fillText('← testaram POSITIVO', x0, y - 8);
      ct.textAlign = 'right';
      ct.fillText('testaram NEGATIVO →', x0 + w, y - 8);

      ct.font = '10px system-ui, sans-serif'; ct.textBaseline = 'top';
      ct.textAlign = 'left'; ct.fillStyle = '#8c2f39';
      ct.fillText('■ verdadeiros +', x0, y + h + 8);
      ct.fillStyle = '#b08086';
      ct.fillText('■ falsos +', x0 + 92, y + h + 8);
      ct.fillStyle = '#7f98ac';
      ct.fillText('■ falsos −', x0 + 160, y + h + 8);
      ct.fillStyle = '#2c5f8d';
      ct.fillText('■ verdadeiros −', x0 + 224, y + h + 8);
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     6. Distribuição discreta definida pelo usuário
     ================================================================= */
  function discreta(raiz) {
    var c = moldura(raiz, 'Laboratório: média e variância de uma distribuição discreta');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var iX = numero(ctr, 'Valores x<sub>i</sub> (vírgula)', '', atualizar, { type: 'text' });
    var iP = numero(ctr, 'Probabilidades P<sub>i</sub>', '', atualizar, { type: 'text' });
    iX.value = '0, 1, 2'; iP.value = '0.5, 0.25, 0.25';

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'Σ P<sub>i</sub>', k: 's' }, { rot: '⟨x⟩', k: 'm' },
      { rot: '⟨x²⟩', k: 'm2' }, { rot: 'σ² = ⟨x²⟩−⟨x⟩²', k: 'v' },
      { rot: 'σ', k: 'd' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return !isNaN(v); });
    }

    function atualizar() {
      var xs = ler(iX.value), ps = ler(iP.value);
      var n = Math.min(xs.length, ps.length);
      if (n === 0) {
        saida.innerHTML = 'Informe ao menos um par (x, P).';
        painel({ s: '—', m: '—', m2: '—', v: '—', d: '—' });
        return;
      }
      xs = xs.slice(0, n); ps = ps.slice(0, n);
      var soma = 0, m = 0, m2 = 0;
      for (var i = 0; i < n; i++) { soma += ps[i]; m += xs[i] * ps[i]; m2 += xs[i] * xs[i] * ps[i]; }
      var v = m2 - m * m, d = Math.sqrt(Math.max(0, v));

      painel({ s: M.fmt(soma, 4), m: M.fmt(m, 4), m2: M.fmt(m2, 4),
               v: M.fmt(v, 4), d: M.fmt(d, 4) });

      var msg = '';
      if (Math.abs(soma - 1) > 1e-6)
        msg = '<b style="color:#8c2f39">Atenção: ΣP<sub>i</sub> = ' + M.fmt(soma, 4)
            + ' ≠ 1.</b> A distribuição não está normalizada, e média e variância perdem o sentido.';
      else if (ps.some(function (p) { return p < 0; }))
        msg = '<b style="color:#8c2f39">Há probabilidade negativa — viola o Axioma 1.</b>';
      else {
        var possivel = xs.some(function (x) { return Math.abs(x - m) < 1e-9; });
        msg = 'Distribuição válida. ⟨x⟩ = <b>' + M.fmt(m, 4) + '</b>, σ = <b>' + M.fmt(d, 4) + '</b>. '
            + (possivel ? 'A média coincide com um dos valores possíveis.'
                        : '<b>A média não é um dos valores possíveis</b> — lembre do exemplo dos 2,4 filhos.');
      }
      saida.innerHTML = msg;
      desenhar(xs, ps, m, d);
    }

    function desenhar(xs, ps, m, d) {
      var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
      var folga = Math.max(0.6, (xmax - xmin) * 0.12);
      var g = G.eixos(cv, {
        xmin: xmin - folga, xmax: xmax + folga,
        ymax: Math.max.apply(null, ps) * 1.2 || 1, altura: 240,
        rotX: 'x', rotY: 'P(x)',
        marcasX: xs.map(function (x) { return { v: x, r: M.fmt(x, 0) }; }),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      G.barras(g, xs.map(function (x, i) { return { x: x, y: ps[i] }; }), G.COR.azul, 0.3);
      G.vertical(g, m, G.COR.vinho, '⟨x⟩');
      if (d > 0) {
        G.vertical(g, m - d, G.COR.ambar, 'σ');
        G.vertical(g, m + d, G.COR.ambar, '');
      }
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     7. Binomial e Poisson
     ================================================================= */
  function binomial(raiz) {
    var c = moldura(raiz, 'Distribuição binomial (com aproximações de Poisson e Normal)');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var n = 20, p = 0.4, mostrarPoisson = false, mostrarNormal = false;
    deslizante(ctr, 'n', 1, 300, 1, 20, function (v) { n = v; atualizar(); });
    deslizante(ctr, 'p', 0, 1, 0.01, 0.4, function (v) { p = v; atualizar(); },
      function (v) { return v.toFixed(2).replace('.', ','); });

    var caixas = el('div', { class: 'campo' });
    caixas.innerHTML = '<label>Sobrepor</label>';
    var lp = el('label', { html: '<input type="checkbox" id="cbPoi"> Poisson (m = np)',
      style: 'font-weight:400;text-transform:none;letter-spacing:0;font-size:.82rem' });
    var ln = el('label', { html: '<input type="checkbox" id="cbNor"> Normal (np, np(1−p))',
      style: 'font-weight:400;text-transform:none;letter-spacing:0;font-size:.82rem' });
    caixas.appendChild(lp); caixas.appendChild(ln); ctr.appendChild(caixas);
    lp.querySelector('input').addEventListener('change', function (e) {
      mostrarPoisson = e.target.checked; atualizar();
    });
    ln.querySelector('input').addEventListener('change', function (e) {
      mostrarNormal = e.target.checked; atualizar();
    });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'média np', k: 'm' }, { rot: 'variância np(1−p)', k: 'v' },
      { rot: 'desvio σ', k: 'd' }, { rot: 'largura σ/⟨k⟩', k: 'lf' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var media = n * p, varia = n * p * (1 - p), dp = Math.sqrt(varia);
      painel({ m: M.fmt(media, 3), v: M.fmt(varia, 3), d: M.fmt(dp, 3),
               lf: media > 0 ? M.pct(dp / media) : '—' });

      var kmin = Math.max(0, Math.floor(media - 4.2 * dp - 1));
      var kmax = Math.min(n, Math.ceil(media + 4.2 * dp + 1));
      if (kmax - kmin < 6) { kmin = Math.max(0, kmin - 3); kmax = Math.min(n, kmax + 3); }
      var dados = [], ymax = 0;
      for (var k = kmin; k <= kmax; k++) {
        var y = M.pBinomial(n, k, p);
        dados.push({ x: k, y: y });
        if (y > ymax) ymax = y;
      }
      var g = G.eixos(cv, {
        xmin: kmin - 0.6, xmax: kmax + 0.6, ymax: ymax * 1.18 || 1, altura: 280,
        rotX: 'k (número de sucessos)', rotY: 'P(k)',
        marcasX: G.marcasInteiras(kmin, kmax, 12),
        formataY: function (v) { return v.toFixed(3).replace('.', ','); }
      });
      G.barras(g, dados, G.COR.azulClaro, 0.78);

      var leg = [{ texto: 'Binomial', cor: G.COR.azulClaro }];
      if (mostrarPoisson) {
        var ctp = g.ct;
        ctp.strokeStyle = G.COR.verde; ctp.lineWidth = 2; ctp.beginPath();
        var primeiro = true;
        for (var j = kmin; j <= kmax; j++) {
          var yy = M.pPoisson(j, media);
          var px = g.X(j), py = g.Y(Math.min(yy, g.ymax));
          if (primeiro) { ctp.moveTo(px, py); primeiro = false; } else ctp.lineTo(px, py);
        }
        ctp.stroke();
        leg.push({ texto: 'Poisson m=' + M.fmt(media, 2), cor: G.COR.verde });
      }
      if (mostrarNormal && dp > 0) {
        G.curva(g, function (x) { return M.dNormal(x, media, dp); }, G.COR.vinho, 2);
        leg.push({ texto: 'Normal', cor: G.COR.vinho });
      }
      G.vertical(g, media, G.COR.ambar, '');
      G.legenda(g, leg);

      var obs = [];
      if (n >= 20 && n * p <= 5) obs.push('com \\(n\\gg1\\) e \\(np\\) pequeno, a <b>Poisson</b> é uma boa aproximação');
      if (n * p * (1 - p) >= 9) obs.push('com \\(np(1-p)\\ge 9\\), a <b>Normal</b> já descreve bem o perfil');
      saida.innerHTML = 'Com n = <b>' + n + '</b> e p = <b>' + M.fmt(p, 2) + '</b>: espera-se <b>'
        + M.fmt(media, 2) + '</b> sucessos, com dispersão σ = <b>' + M.fmt(dp, 2) + '</b>. '
        + 'A largura fracionária σ/⟨k⟩ cai como \\(1/\\sqrt{n}\\).'
        + (obs.length ? ' Aqui, ' + obs.join(' e ') + '.' : '');
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     8. Poisson isolada (contagem de eventos raros)
     ================================================================= */
  function poisson(raiz) {
    var c = moldura(raiz, 'Distribuição de Poisson');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var m = 2.5;
    deslizante(ctr, 'm (média de eventos)', 0.1, 30, 0.1, 2.5, function (v) { m = v; atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'média', k: 'm' }, { rot: 'variância', k: 'v' },
      { rot: 'σ', k: 'd' }, { rot: 'P(0) nenhum evento', k: 'p0' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var dp = Math.sqrt(m);
      painel({ m: M.fmt(m, 3), v: M.fmt(m, 3), d: M.fmt(dp, 3), p0: M.pct(Math.exp(-m)) });
      var kmax = Math.max(6, Math.ceil(m + 4.5 * dp));
      var dados = [], ymax = 0;
      for (var k = 0; k <= kmax; k++) {
        var y = M.pPoisson(k, m); dados.push({ x: k, y: y }); if (y > ymax) ymax = y;
      }
      var g = G.eixos(cv, {
        xmin: -0.6, xmax: kmax + 0.6, ymax: ymax * 1.18, altura: 260,
        rotX: 'k (número de ocorrências)', rotY: 'P(k)',
        marcasX: G.marcasInteiras(0, kmax, 12),
        formataY: function (v) { return v.toFixed(3).replace('.', ','); }
      });
      G.barras(g, dados, G.COR.verde, 0.76);
      G.vertical(g, m, G.COR.vinho, 'm');
      saida.innerHTML = 'Para a Poisson, <b>média = variância = m</b>. Com m = ' + M.fmt(m, 2)
        + ', o desvio padrão é \\(\\sqrt{m}\\) = <b>' + M.fmt(dp, 3) + '</b>, e a probabilidade de '
        + '<b>nenhuma</b> ocorrência é \\(e^{-m}\\) = <b>' + M.pct(Math.exp(-m)) + '</b>.';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     9. Normal: área sob a curva e tabela z
     ================================================================= */
  function normal(raiz) {
    var c = moldura(raiz, 'Distribuição normal: área sob a curva');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var mu = 0, sg = 1, a = -1, b = 1;
    deslizante(ctr, 'μ', -10, 10, 0.1, 0, function (v) { mu = v; sincronizar(); atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });
    deslizante(ctr, 'σ', 0.1, 6, 0.1, 1, function (v) { sg = v; sincronizar(); atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });
    var iA = numero(ctr, 'limite inferior a', -1, function () { a = Number(iA.value); atualizar(); });
    var iB = numero(ctr, 'limite superior b', 1, function () { b = Number(iB.value); atualizar(); });

    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);
    botao(bts, '±1σ', function () { definir(mu - sg, mu + sg); }, true);
    botao(bts, '±2σ', function () { definir(mu - 2 * sg, mu + 2 * sg); }, true);
    botao(bts, '±3σ', function () { definir(mu - 3 * sg, mu + 3 * sg); }, true);

    function definir(x, y) { a = x; b = y; iA.value = M.fmt(x, 2).replace(',', '.');
      iB.value = M.fmt(y, 2).replace(',', '.'); atualizar(); }
    function sincronizar() { }

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'P(a ≤ X ≤ b)', k: 'p' }, { rot: 'z de a', k: 'za' },
      { rot: 'z de b', k: 'zb' }, { rot: 'P(X ≤ a)', k: 'fa' }, { rot: 'P(X ≥ b)', k: 'fb' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var Fa = M.FNormal(a, mu, sg), Fb = M.FNormal(b, mu, sg);
      var prob = Math.max(0, Fb - Fa);
      var za = (a - mu) / sg, zb = (b - mu) / sg;
      painel({ p: M.pct(prob, 3), za: M.fmt(za, 3), zb: M.fmt(zb, 3),
               fa: M.pct(Fa, 3), fb: M.pct(1 - Fb, 3) });

      var xmin = mu - 4.2 * sg, xmax = mu + 4.2 * sg;
      var pico = M.dNormal(mu, mu, sg);
      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax, ymax: pico * 1.16, altura: 280,
        rotX: 'x', rotY: 'densidade P(x)',
        marcasX: G.marcasLineares(xmin, xmax, 8, Math.abs(xmax - xmin) > 12 ? 0 : 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var f = function (x) { return M.dNormal(x, mu, sg); };
      G.area(g, f, Math.min(a, b), Math.max(a, b), 'rgba(44,95,141,.3)');
      G.curva(g, f, G.COR.vinho, 2.2);
      G.vertical(g, mu, G.COR.ambar, 'μ');
      G.vertical(g, Math.min(a, b), G.COR.azul, 'a');
      G.vertical(g, Math.max(a, b), G.COR.azul, 'b');

      saida.innerHTML = 'A área sombreada vale <b>' + M.pct(prob, 3) + '</b>. '
        + 'Em unidades padronizadas, \\(z=(x-\\mu)/\\sigma\\), o intervalo vai de <b>'
        + M.fmt(za, 2) + '</b> a <b>' + M.fmt(zb, 2) + '</b> — e essa probabilidade '
        + 'não depende de μ nem de σ, apenas de z.';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     10. Teorema Central do Limite
     ================================================================= */
  function tcl(raiz) {
    var c = moldura(raiz, 'Teorema Central do Limite: médias de amostras');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var origem = 'uniforme', nAm = 2;
    var campoSel = el('div', { class: 'campo' });
    campoSel.innerHTML = '<label>Distribuição de origem</label>';
    var sel = el('select');
    [['uniforme', 'Uniforme em [0,1]'], ['exponencial', 'Exponencial (λ=1)'],
     ['bernoulli', 'Bernoulli (p=0,3)'], ['bimodal', 'Bimodal (dois picos)']]
      .forEach(function (o) { sel.appendChild(el('option', { value: o[0], texto: o[1] })); });
    campoSel.appendChild(sel); ctr.appendChild(campoSel);
    sel.addEventListener('change', function () { origem = sel.value; zerar(); });

    deslizante(ctr, 'tamanho da amostra n', 1, 60, 1, 2, function (v) { nAm = v; zerar(); });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda',
      html: 'Histograma das médias amostrais &nbsp;•&nbsp; curva vermelha: normal prevista pelo TCL' }));
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var caixas = new Array(44).fill(0), total = 0, somaM = 0, somaM2 = 0;

    function sortearUm() {
      switch (origem) {
        case 'exponencial': return -Math.log(Math.random() || 1e-12);
        case 'bernoulli': return Math.random() < 0.3 ? 1 : 0;
        case 'bimodal': return Math.random() < 0.5
          ? 0.15 + 0.1 * Math.random() : 0.75 + 0.2 * Math.random();
        default: return Math.random();
      }
    }

    function parametros() {
      switch (origem) {
        case 'exponencial': return { mu: 1, sg: 1, lo: 0, hi: 4 };
        case 'bernoulli': return { mu: 0.3, sg: Math.sqrt(0.21), lo: -0.2, hi: 1.2 };
        case 'bimodal': return { mu: 0.525, sg: 0.311, lo: 0, hi: 1 };
        default: return { mu: 0.5, sg: Math.sqrt(1 / 12), lo: 0, hi: 1 };
      }
    }

    function simular(q) {
      var P = parametros();
      var lo = P.mu - 4.2 * P.sg / Math.sqrt(nAm), hi = P.mu + 4.2 * P.sg / Math.sqrt(nAm);
      for (var i = 0; i < q; i++) {
        var s = 0;
        for (var j = 0; j < nAm; j++) s += sortearUm();
        var md = s / nAm;
        somaM += md; somaM2 += md * md; total++;
        var idx = Math.floor((md - lo) / (hi - lo) * caixas.length);
        if (idx >= 0 && idx < caixas.length) caixas[idx]++;
      }
      desenhar();
    }

    function zerar() { caixas = new Array(44).fill(0); total = 0; somaM = 0; somaM2 = 0; desenhar(); }

    function desenhar() {
      var P = parametros();
      var sgM = P.sg / Math.sqrt(nAm);
      var lo = P.mu - 4.2 * sgM, hi = P.mu + 4.2 * sgM;
      var larg = (hi - lo) / caixas.length;
      var dens = caixas.map(function (q) { return total ? q / (total * larg) : 0; });
      var pico = M.dNormal(P.mu, P.mu, sgM);
      var ymax = Math.max(pico, Math.max.apply(null, dens)) * 1.16;

      var g = G.eixos(cv, {
        xmin: lo, xmax: hi, ymax: ymax, altura: 280,
        rotX: 'média da amostra', rotY: 'densidade',
        marcasX: G.marcasLineares(lo, hi, 6, 2),
        formataY: function (v) { return v.toFixed(1).replace('.', ','); }
      });
      var ct = g.ct;
      ct.fillStyle = G.COR.azulClaro;
      dens.forEach(function (d, i) {
        if (d <= 0) return;
        var x0 = g.X(lo + i * larg), x1 = g.X(lo + (i + 1) * larg), y = g.Y(Math.min(d, g.ymax));
        ct.fillRect(x0 + 0.5, y, Math.max(1, x1 - x0 - 1), g.y1 - y);
      });
      G.curva(g, function (x) { return M.dNormal(x, P.mu, sgM); }, G.COR.vinho, 2.2);
      G.vertical(g, P.mu, G.COR.ambar, 'μ');

      var mObs = total ? somaM / total : 0;
      var sObs = total > 1 ? Math.sqrt(Math.max(0, somaM2 / total - mObs * mObs)) : 0;
      saida.innerHTML = total === 0
        ? 'Previsão do TCL para n = ' + nAm + ': médias centradas em <b>' + M.fmt(P.mu, 3)
          + '</b> com desvio \\(\\sigma/\\sqrt{n}\\) = <b>' + M.fmt(sgM, 4) + '</b>. Simule para comparar.'
        : '<b>' + total.toLocaleString('pt-BR') + '</b> amostras de tamanho n = <b>' + nAm + '</b>. '
          + 'Média observada: <b>' + M.fmt(mObs, 4) + '</b> (prevista ' + M.fmt(P.mu, 4) + '); '
          + 'desvio observado: <b>' + M.fmt(sObs, 4) + '</b> (previsto \\(\\sigma/\\sqrt{n}\\) = '
          + M.fmt(sgM, 4) + ').';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    botao(bts, '+1 000 amostras', function () { simular(1000); });
    botao(bts, '+50 000', function () { simular(50000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     11. Passeio aleatório
     ================================================================= */
  function passeio(raiz) {
    var c = moldura(raiz, 'Passeio aleatório unidimensional');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var nPassos = 100, nTraj = 12;
    deslizante(ctr, 'número de passos n', 10, 1000, 10, 100, function (v) { nPassos = v; gerar(); });
    deslizante(ctr, 'trajetórias', 1, 60, 1, 12, function (v) { nTraj = v; gerar(); });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda',
      html: 'Linhas tracejadas: envelope \\(\\pm\\sqrt{n}\\,L\\) previsto pela teoria' }));
    var painel = cartoes(c, [
      { rot: '⟨x⟩ teórico', k: 'mt' }, { rot: '⟨x⟩ observado', k: 'mo' },
      { rot: 'σ teórico = √n·L', k: 'st' }, { rot: 'σ observado', k: 'so' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var trajetorias = [];

    function gerar() {
      trajetorias = [];
      for (var t = 0; t < nTraj; t++) {
        var x = 0, cam = [0];
        for (var i = 0; i < nPassos; i++) { x += Math.random() < 0.5 ? -1 : 1; cam.push(x); }
        trajetorias.push(cam);
      }
      desenhar();
    }

    function desenhar() {
      var lim = Math.max(3, Math.ceil(3.2 * Math.sqrt(nPassos)));
      var g = G.eixos(cv, {
        xmin: 0, xmax: nPassos, ymin: -lim, ymax: lim, altura: 290,
        rotX: 'número de passos', rotY: 'posição x (em unidades de L)',
        marcasX: G.marcasLineares(0, nPassos, 5, 0),
        formataY: function (v) { return v.toFixed(0); }
      });
      var ct = g.ct;
      // envelope
      ct.save();
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 1.6; ct.setLineDash([6, 4]);
      [1, -1].forEach(function (s) {
        ct.beginPath();
        for (var i = 0; i <= nPassos; i++) {
          var y = s * Math.sqrt(i), px = g.X(i), py = g.Y(Math.max(-lim, Math.min(lim, y)));
          if (i === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
        }
        ct.stroke();
      });
      ct.restore();

      ct.lineWidth = 1.1;
      trajetorias.forEach(function (cam, k) {
        ct.strokeStyle = 'hsla(' + (200 + 28 * (k % 5)) + ',45%,42%,.62)';
        ct.beginPath();
        cam.forEach(function (x, i) {
          var px = g.X(i), py = g.Y(Math.max(-lim, Math.min(lim, x)));
          if (i === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
        });
        ct.stroke();
      });

      var finais = trajetorias.map(function (c2) { return c2[c2.length - 1]; });
      var mo = finais.reduce(function (a, b) { return a + b; }, 0) / (finais.length || 1);
      var so = Math.sqrt(finais.reduce(function (a, b) { return a + b * b; }, 0) / (finais.length || 1) - mo * mo);
      painel({ mt: '0', mo: M.fmt(mo, 2), st: M.fmt(Math.sqrt(nPassos), 2), so: M.fmt(so, 2) });

      saida.innerHTML = 'Após <b>' + nPassos + '</b> passos, a posição média é <b>zero</b> — '
        + 'avanços e recuos se cancelam. Mas a <b>distância típica</b> percorrida cresce como '
        + '\\(\\sqrt{n}\\,L\\) = <b>' + M.fmt(Math.sqrt(nPassos), 2) + '\\(L\\)</b>. '
        + 'É esse \\(\\sqrt{n}\\) que governa a difusão: \\(\\sigma_x=\\sqrt{2Dt}\\).';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    botao(bts, 'Sortear novamente', gerar);
    registrarRedesenho(function () { if (!trajetorias.length) gerar(); else desenhar(); });
  }

  /* =================================================================
     12. Lei dos grandes números (moeda)
     ================================================================= */
  function moeda(raiz) {
    var c = moldura(raiz, 'Lei dos grandes números: frequência de caras');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var p = 0.5;
    deslizante(ctr, 'p (probabilidade de cara)', 0.05, 0.95, 0.01, 0.5,
      function (v) { p = v; zerar(); }, function (v) { return v.toFixed(2).replace('.', ','); });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var serie = [], caras = 0, n = 0;

    function lancar(q) {
      for (var i = 0; i < q; i++) {
        n++; if (Math.random() < p) caras++;
        if (n <= 200 || n % Math.max(1, Math.floor(n / 400)) === 0)
          serie.push({ n: n, f: caras / n });
      }
      desenhar();
    }
    function zerar() { serie = []; caras = 0; n = 0; desenhar(); }

    function desenhar() {
      var xmax = Math.max(50, n);
      var g = G.eixos(cv, {
        xmin: 1, xmax: xmax, ymin: 0, ymax: 1, altura: 250,
        rotX: 'número de lançamentos', rotY: 'frequência de caras',
        marcasX: G.marcasLineares(1, xmax, 5, 0),
        formataY: function (v) { return v.toFixed(1).replace('.', ','); }
      });
      G.vertical(g, 0, G.COR.grade);
      var ct = g.ct;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 1.6; ct.setLineDash([6, 4]);
      ct.beginPath(); ct.moveTo(g.x0, g.Y(p)); ct.lineTo(g.x1, g.Y(p)); ct.stroke();
      ct.setLineDash([]);
      if (serie.length) {
        ct.strokeStyle = G.COR.azul; ct.lineWidth = 1.5; ct.beginPath();
        serie.forEach(function (s, i) {
          var px = g.X(s.n), py = g.Y(s.f);
          if (i === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
        });
        ct.stroke();
      }
      ct.fillStyle = G.COR.vinho; ct.font = '600 11px system-ui, sans-serif';
      ct.textAlign = 'left'; ct.textBaseline = 'bottom';
      ct.fillText('p = ' + M.fmt(p, 2), g.x0 + 6, g.Y(p) - 4);

      saida.innerHTML = n === 0
        ? 'Lance a moeda e observe a frequência oscilar muito no começo e depois estabilizar em p.'
        : '<b>' + n.toLocaleString('pt-BR') + '</b> lançamentos, <b>' + caras.toLocaleString('pt-BR')
          + '</b> caras. Frequência: <b>' + M.pct(caras / n, 3) + '</b> (p = ' + M.pct(p, 1) + '). '
          + 'Desvio: <b>' + M.pct(Math.abs(caras / n - p), 3) + '</b> — tende a cair como \\(1/\\sqrt{n}\\).';
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([saida]);
    }

    botao(bts, '+10', function () { lancar(10); });
    botao(bts, '+1 000', function () { lancar(1000); });
    botao(bts, '+100 000', function () { lancar(100000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     13. Exponencial e decaimento radioativo
     ================================================================= */
  function exponencial(raiz) {
    var c = moldura(raiz, 'Distribuição exponencial e decaimento radioativo');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var lam = 1;
    deslizante(ctr, 'λ (taxa)', 0.1, 5, 0.1, 1, function (v) { lam = v; atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'vida média ⟨t⟩ = 1/λ', k: 'tm' }, { rot: 'meia-vida ln2/λ', k: 'mv' },
      { rot: 'σ = 1/λ', k: 'sg' }, { rot: 'P(t > ⟨t⟩)', k: 'ps' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var tm = 1 / lam, mv = Math.log(2) / lam;
      painel({ tm: M.fmt(tm, 3), mv: M.fmt(mv, 3), sg: M.fmt(tm, 3),
               ps: M.pct(Math.exp(-1)) });
      var xmax = 5 / lam;
      var g = G.eixos(cv, {
        xmin: 0, xmax: xmax, ymax: lam * 1.14, altura: 270,
        rotX: 't (tempo)', rotY: 'densidade λe^(−λt)',
        marcasX: G.marcasLineares(0, xmax, 5, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var f = function (t) { return lam * Math.exp(-lam * t); };
      G.area(g, f, 0, mv, 'rgba(140,47,57,.18)');
      G.curva(g, f, G.COR.vinho, 2.2);
      G.vertical(g, mv, G.COR.azul, 't½');
      G.vertical(g, tm, G.COR.ambar, '⟨t⟩');
      saida.innerHTML = 'A área sombreada (de 0 a t½) vale exatamente <b>50%</b>: metade dos núcleos '
        + 'já decaiu. Note que a <b>vida média</b> ⟨t⟩ = 1/λ = <b>' + M.fmt(tm, 3)
        + '</b> é maior que a <b>meia-vida</b> = <b>' + M.fmt(mv, 3) + '</b> — a cauda longa puxa a média. '
        + 'A distribuição <b>não tem memória</b>: um núcleo que sobreviveu até t tem a mesma '
        + 'perspectiva de futuro que um recém-criado.';
    }
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     14. Estatística descritiva: histograma, boxplot e medidas
     ================================================================= */
  var CONJUNTOS = {
    alturas: { rot: 'Alturas de 40 estudantes (cm)', dados:
      '168 172 159 181 175 163 170 178 165 174 169 182 157 171 166 177 173 160 ' +
      '176 168 164 179 170 172 158 183 167 175 161 169 174 180 166 171 162 177 ' +
      '173 168 176 170' },
    notas: { rot: 'Notas de uma turma (0 a 10)', dados:
      '7.5 6.0 8.5 5.5 9.0 7.0 6.5 8.0 4.5 7.5 6.0 9.5 7.0 5.0 8.0 6.5 7.5 ' +
      '3.5 8.5 7.0 6.0 9.0 5.5 7.5 8.0 6.5 7.0 4.0 8.5 7.5' },
    medidas: { rot: 'Medidas repetidas de g (m/s²)', dados:
      '9.79 9.83 9.78 9.81 9.85 9.80 9.77 9.82 9.84 9.79 9.81 9.76 9.83 9.80 ' +
      '9.78 9.82 9.81 9.79 9.84 9.80' },
    assimetrica: { rot: 'Renda mensal (salários mínimos) — assimétrica', dados:
      '1 1 1.2 1.3 1.5 1.5 1.8 2 2 2.1 2.3 2.5 2.5 3 3.2 3.5 4 4.5 5 6 7 9 12 18 30' },
    outliers: { rot: 'Tempos de reação (ms) — com outliers', dados:
      '245 252 238 261 249 255 243 258 247 251 240 256 250 244 253 410 248 259 ' +
      '242 254 120 246' }
  };

  function descritiva(raiz) {
    var c = moldura(raiz, 'Laboratório: histograma, boxplot e medidas descritivas');

    /* entrada de dados */
    var campoTxt = el('div', { class: 'campo', style: 'flex-basis:100%;min-width:100%' });
    campoTxt.appendChild(el('label', { html: 'Cole seus dados (separados por espaço, vírgula ou linha)' }));
    var ta = el('textarea', { rows: '3', style:
      'width:100%;font-family:var(--mono);font-size:.82rem;padding:.45rem .55rem;' +
      'border:1px solid var(--borda);border-radius:6px;resize:vertical' });
    campoTxt.appendChild(ta);
    c.appendChild(campoTxt);

    var ctrPre = el('div', { class: 'botoes', style: 'margin:.6rem 0 .9rem' });
    c.appendChild(ctrPre);
    Object.keys(CONJUNTOS).forEach(function (k) {
      botao(ctrPre, CONJUNTOS[k].rot.split(' —')[0].split(' (')[0], function () {
        ta.value = CONJUNTOS[k].dados; atualizar();
      }, true);
    });

    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var nClasses = 0; // 0 = automático (Sturges)
    var sl = deslizante(ctr, 'Número de classes', 0, 25, 1, 0, function (v) {
      nClasses = v; atualizar();
    }, function (v) { return v === 0 ? 'automático' : String(v); });

    var cvH = el('canvas'); c.appendChild(cvH);
    c.appendChild(el('div', { class: 'legenda', html:
      'Histograma &nbsp;·&nbsp; linha vermelha: média &nbsp;·&nbsp; linha azul: mediana' }));
    var cvB = el('canvas'); c.appendChild(cvB);
    c.appendChild(el('div', { class: 'legenda', html:
      'Boxplot &nbsp;·&nbsp; caixa de Q₁ a Q₃ &nbsp;·&nbsp; bigodes até 1,5×IQR &nbsp;·&nbsp; pontos: outliers' }));

    var painel = cartoes(c, [
      { rot: 'n', k: 'n' }, { rot: 'média x̄', k: 'media' },
      { rot: 'mediana', k: 'med' }, { rot: 'moda', k: 'moda' },
      { rot: 'desvio padrão s', k: 's' }, { rot: 'variância s²', k: 'v' },
      { rot: 'Q₁', k: 'q1' }, { rot: 'Q₃', k: 'q3' },
      { rot: 'IQR', k: 'iqr' }, { rot: 'amplitude', k: 'amp' },
      { rot: 'assimetria', k: 'as' }, { rot: 'coef. de variação', k: 'cv' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler() {
      return String(ta.value).split(/[\s,;]+/).map(function (t) {
        return Number(t.replace(',', '.'));
      }).filter(function (v) { return isFinite(v); }).sort(function (a, b) { return a - b; });
    }

    /* quantil por interpolação linear (método 7, o do R e do Excel) */
    function quantil(ord, p) {
      var n = ord.length;
      if (!n) return NaN;
      if (n === 1) return ord[0];
      var h = (n - 1) * p, lo = Math.floor(h), fr = h - lo;
      return ord[lo] + fr * (ord[Math.min(lo + 1, n - 1)] - ord[lo]);
    }

    function atualizar() {
      var d = ler(), n = d.length;
      if (n < 2) {
        painel({ n: String(n), media: '—', med: '—', moda: '—', s: '—', v: '—',
                 q1: '—', q3: '—', iqr: '—', amp: '—', as: '—', cv: '—' });
        saida.innerHTML = 'Informe pelo menos dois valores, ou escolha um dos conjuntos de exemplo acima.';
        G.preparar(cvH, 230); G.preparar(cvB, 110);
        return;
      }

      var soma = 0;
      d.forEach(function (x) { soma += x; });
      var media = soma / n;
      var s2 = 0, m3 = 0;
      d.forEach(function (x) { s2 += (x - media) * (x - media); });
      s2 /= (n - 1);
      var s = Math.sqrt(s2);
      d.forEach(function (x) { m3 += Math.pow((x - media) / (s || 1), 3); });
      var assim = n > 2 ? (n / ((n - 1) * (n - 2))) * m3 : 0;

      var mediana = quantil(d, 0.5), q1 = quantil(d, 0.25), q3 = quantil(d, 0.75);
      var iqr = q3 - q1, min = d[0], max = d[n - 1];

      /* moda */
      var freq = {}, maxf = 0, modas = [];
      d.forEach(function (x) { freq[x] = (freq[x] || 0) + 1; if (freq[x] > maxf) maxf = freq[x]; });
      Object.keys(freq).forEach(function (k) { if (freq[k] === maxf) modas.push(Number(k)); });
      var textoModa = maxf === 1 ? 'amodal'
        : (modas.length > 2 ? modas.length + ' modas' : modas.map(function (x) { return M.fmt(x, 2); }).join(' e '));

      /* outliers pela regra 1,5×IQR */
      var limInf = q1 - 1.5 * iqr, limSup = q3 + 1.5 * iqr;
      var fora = d.filter(function (x) { return x < limInf || x > limSup; });
      var dentro = d.filter(function (x) { return x >= limInf && x <= limSup; });
      var bigInf = dentro.length ? dentro[0] : min;
      var bigSup = dentro.length ? dentro[dentro.length - 1] : max;

      painel({
        n: String(n), media: M.fmt(media, 3), med: M.fmt(mediana, 3), moda: textoModa,
        s: M.fmt(s, 3), v: M.fmt(s2, 4), q1: M.fmt(q1, 3), q3: M.fmt(q3, 3),
        iqr: M.fmt(iqr, 3), amp: M.fmt(max - min, 3), as: M.fmt(assim, 3),
        cv: media !== 0 ? M.pct(Math.abs(s / media), 1) : '—'
      });

      desenharHist(d, media, mediana, min, max);
      desenharBox(q1, mediana, q3, bigInf, bigSup, fora, min, max);

      var leitura;
      if (Math.abs(assim) < 0.3) leitura = 'A distribuição é <b>aproximadamente simétrica</b>, e média e mediana quase coincidem.';
      else if (assim > 0) leitura = 'A distribuição é <b>assimétrica à direita</b> (cauda longa nos valores altos): a média é <b>puxada para cima</b> da mediana. Aqui a mediana descreve melhor o "valor típico".';
      else leitura = 'A distribuição é <b>assimétrica à esquerda</b>: a média fica <b>abaixo</b> da mediana.';

      saida.innerHTML = leitura
        + (fora.length ? ' Pela regra de 1,5×IQR há <b>' + fora.length + ' outlier'
            + (fora.length > 1 ? 's' : '') + '</b>: ' + fora.map(function (x) { return M.fmt(x, 2); }).join(', ')
            + '. Note quanto eles deslocam a média sem mexer na mediana — apague-os do campo de texto e compare.'
           : ' Nenhum outlier pela regra de 1,5×IQR.');
    }

    function desenharHist(d, media, mediana, min, max) {
      var n = d.length;
      var k = nClasses > 0 ? nClasses : Math.max(3, Math.ceil(1 + 3.322 * Math.log10(n)));
      var lo = min, hi = max;
      if (hi === lo) { lo -= 0.5; hi += 0.5; }
      var larg = (hi - lo) / k;
      var cont = new Array(k).fill(0);
      d.forEach(function (x) {
        var i = Math.min(k - 1, Math.floor((x - lo) / larg));
        cont[i]++;
      });
      /* topo inteiro e divisível, para que as marcas do eixo y sejam inteiras */
      var topo = Math.max(1, Math.ceil(Math.max.apply(null, cont) * 1.15));
      var div = 0, cand = [5, 4, 6, 3, 2];
      for (var ci = 0; ci < cand.length; ci++) {
        if (topo % cand[ci] === 0) { div = cand[ci]; break; }
      }
      if (!div) {
        if (topo <= 6) { div = topo; }
        else { topo += (5 - topo % 5) % 5; div = 5; }
      }
      var folga = larg * 0.35;
      var g = G.eixos(cvH, {
        xmin: lo - folga, xmax: hi + folga, ymax: topo, altura: 250,
        rotX: 'valor', rotY: 'frequência',
        marcasX: G.marcasLineares(lo, hi, Math.min(6, k), (hi - lo) > 20 ? 0 : 1),
        divY: div,
        formataY: function (v) { return String(Math.round(v)); }
      });
      var ct = g.ct;
      ct.fillStyle = G.COR.azulClaro;
      ct.strokeStyle = '#ffffff'; ct.lineWidth = 1;
      cont.forEach(function (q, i) {
        if (!q) return;
        var x0 = g.X(lo + i * larg), x1 = g.X(lo + (i + 1) * larg), y = g.Y(q);
        ct.fillRect(x0, y, x1 - x0, g.y1 - y);
        ct.strokeRect(x0, y, x1 - x0, g.y1 - y);
      });
      G.vertical(g, media, G.COR.vinho, 'x̄');
      G.vertical(g, mediana, G.COR.azul, 'med');
    }

    function desenharBox(q1, med, q3, bigInf, bigSup, fora, min, max) {
      var p = G.preparar(cvB, 120), ct = p.ct;
      var marg = 28, lo = min, hi = max;
      if (hi === lo) { lo -= 0.5; hi += 0.5; }
      var folga = (hi - lo) * 0.08;
      lo -= folga; hi += folga;
      function X(v) { return marg + (v - lo) / (hi - lo) * (p.L - 2 * marg); }
      var yc = 44, h = 34;

      ct.strokeStyle = G.COR.azul; ct.lineWidth = 1.4;
      // bigodes
      ct.beginPath();
      ct.moveTo(X(bigInf), yc); ct.lineTo(X(q1), yc);
      ct.moveTo(X(q3), yc); ct.lineTo(X(bigSup), yc);
      ct.moveTo(X(bigInf), yc - h / 3); ct.lineTo(X(bigInf), yc + h / 3);
      ct.moveTo(X(bigSup), yc - h / 3); ct.lineTo(X(bigSup), yc + h / 3);
      ct.stroke();
      // caixa
      ct.fillStyle = 'rgba(44,95,141,.22)';
      ct.fillRect(X(q1), yc - h / 2, X(q3) - X(q1), h);
      ct.strokeRect(X(q1), yc - h / 2, X(q3) - X(q1), h);
      // mediana
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.4;
      ct.beginPath(); ct.moveTo(X(med), yc - h / 2); ct.lineTo(X(med), yc + h / 2); ct.stroke();
      // outliers
      ct.fillStyle = G.COR.vinho;
      fora.forEach(function (x) {
        ct.beginPath(); ct.arc(X(x), yc, 3.4, 0, 2 * Math.PI); ct.fill();
      });
      // escala
      ct.strokeStyle = '#c9d2db'; ct.lineWidth = 1;
      ct.beginPath(); ct.moveTo(marg, yc + h / 2 + 14); ct.lineTo(p.L - marg, yc + h / 2 + 14); ct.stroke();
      ct.fillStyle = G.COR.suave; ct.font = '10px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      for (var i = 0; i <= 4; i++) {
        var v = lo + (hi - lo) * i / 4;
        ct.beginPath(); ct.moveTo(X(v), yc + h / 2 + 14); ct.lineTo(X(v), yc + h / 2 + 18); ct.stroke();
        ct.fillText(M.fmt(v, (hi - lo) > 20 ? 0 : 1), X(v), yc + h / 2 + 20);
      }
      // rótulos
      ct.font = '10px system-ui, sans-serif'; ct.textBaseline = 'bottom';
      ct.fillStyle = G.COR.azul;
      ct.fillText('Q₁', X(q1), yc - h / 2 - 3);
      ct.fillText('Q₃', X(q3), yc - h / 2 - 3);
      ct.fillStyle = G.COR.vinho;
      ct.fillText('mediana', X(med), yc - h / 2 - 15);
    }

    ta.addEventListener('input', atualizar);
    ta.value = CONJUNTOS.alturas.dados;
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     13a. Monty Hall
     ================================================================= */
  function montyhall(raiz) {
    var c = moldura(raiz, 'Monty Hall: trocar ou manter?');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var modo = 'informado';
    var campoM = el('div', { class: 'campo', style: 'flex:2 1 300px' });
    campoM.appendChild(el('label', { html: 'Como o apresentador escolhe a porta que abre' }));
    var sel = el('select');
    sel.appendChild(el('option', { value: 'informado',
      texto: 'Ele sabe onde está o carro (jogo clássico)' }));
    sel.appendChild(el('option', { value: 'acaso',
      texto: 'Ele abre uma porta ao acaso (e deu cabra)' }));
    campoM.appendChild(sel); ctr.appendChild(campoM);
    sel.addEventListener('change', function () { modo = sel.value; zerar(); });

    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Frequência de vitórias ao longo das partidas &nbsp;·&nbsp; '
      + 'linhas tracejadas: as probabilidades teóricas' }));
    var painel = cartoes(c, [
      { rot: 'partidas válidas', k: 'n' },
      { rot: 'vitórias trocando', k: 'vt' },
      { rot: 'vitórias mantendo', k: 'vm' },
      { rot: 'descartadas', k: 'd' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var n = 0, trocou = 0, manteve = 0, descartadas = 0, serie = [];

    function jogar(q) {
      for (var i = 0; i < q; i++) {
        var carro = Math.floor(Math.random() * 3);
        var escolha = Math.floor(Math.random() * 3);
        var aberta;
        if (modo === 'informado') {
          /* abre uma porta que não é a escolhida nem a do carro */
          var opcoes = [0, 1, 2].filter(function (p) {
            return p !== escolha && p !== carro;
          });
          aberta = opcoes[Math.floor(Math.random() * opcoes.length)];
        } else {
          /* abre ao acaso entre as duas não escolhidas */
          var livres = [0, 1, 2].filter(function (p) { return p !== escolha; });
          aberta = livres[Math.floor(Math.random() * livres.length)];
          if (aberta === carro) { descartadas++; continue; }  /* revelou o carro: rodada anulada */
        }
        var outra = [0, 1, 2].filter(function (p) {
          return p !== escolha && p !== aberta;
        })[0];
        n++;
        if (outra === carro) trocou++;
        if (escolha === carro) manteve++;
        if (n <= 150 || n % Math.max(1, Math.floor(n / 400)) === 0) {
          serie.push({ n: n, t: trocou / n, m: manteve / n });
        }
      }
      desenhar();
    }

    function zerar() { n = 0; trocou = 0; manteve = 0; descartadas = 0; serie = []; desenhar(); }

    function desenhar() {
      var alvoT = modo === 'informado' ? 2 / 3 : 0.5;
      var alvoM = modo === 'informado' ? 1 / 3 : 0.5;
      var xmax = Math.max(60, n);
      var g = G.eixos(cv, {
        xmin: 1, xmax: xmax, ymin: 0, ymax: 1, altura: 250,
        rotX: 'partidas jogadas', rotY: 'proporção de vitórias',
        marcasX: G.marcasLineares(1, xmax, 5, 0),
        formataY: function (v) { return (100 * v).toFixed(0) + '%'; }
      });
      var ct = g.ct;
      ct.setLineDash([6, 4]); ct.lineWidth = 1.4;
      [[alvoT, G.COR.verde], [alvoM, G.COR.vinho]].forEach(function (par) {
        ct.strokeStyle = par[1];
        ct.beginPath(); ct.moveTo(g.x0, g.Y(par[0])); ct.lineTo(g.x1, g.Y(par[0])); ct.stroke();
      });
      ct.setLineDash([]);
      [['t', G.COR.verde], ['m', G.COR.vinho]].forEach(function (par) {
        if (!serie.length) return;
        ct.strokeStyle = par[1]; ct.lineWidth = 1.8; ct.beginPath();
        serie.forEach(function (s, i) {
          var px = g.X(s.n), py = g.Y(s[par[0]]);
          if (i === 0) ct.moveTo(px, py); else ct.lineTo(px, py);
        });
        ct.stroke();
      });
      G.legenda(g, [
        { texto: 'estratégia: TROCAR', cor: G.COR.verde },
        { texto: 'estratégia: MANTER', cor: G.COR.vinho }
      ]);

      painel({
        n: n.toLocaleString('pt-BR'),
        vt: n ? M.pct(trocou / n, 1) : '—',
        vm: n ? M.pct(manteve / n, 1) : '—',
        d: descartadas.toLocaleString('pt-BR')
      });

      if (n === 0) {
        saida.innerHTML = modo === 'informado'
          ? 'Jogue algumas partidas. A teoria diz que trocar vence em <b>2/3</b> das vezes.'
          : 'Agora o apresentador não sabe onde está o carro. As rodadas em que ele o revela '
            + 'por acidente são descartadas — e só restam as que <em>se parecem</em> com o jogo clássico.';
        return;
      }
      saida.innerHTML = 'Em <b>' + n.toLocaleString('pt-BR') + '</b> partidas: trocar venceu '
        + '<b>' + M.pct(trocou / n, 1) + '</b> das vezes e manter, <b>'
        + M.pct(manteve / n, 1) + '</b>. '
        + (modo === 'informado'
            ? 'Os valores convergem para <b>2/3</b> e <b>1/3</b>: trocar <b>dobra</b> a chance.'
            : 'Agora as duas estratégias empatam em <b>1/2</b>. O evento observado é o mesmo — '
              + 'uma porta aberta com cabra — mas foi <b>gerado por outro mecanismo</b>, e por '
              + 'isso carrega informação diferente. Foram descartadas <b>'
              + descartadas.toLocaleString('pt-BR') + '</b> rodadas em que o carro apareceu.');
    }

    botao(bts, '+1 partida', function () { jogar(1); });
    botao(bts, '+100', function () { jogar(100); });
    botao(bts, '+10 000', function () { jogar(10000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     14a. Triângulo de Pascal interativo
     ================================================================= */
  function pascal(raiz) {
    var c = moldura(raiz, 'O triângulo de Pascal, linha por linha');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var linhas = 8, selN = 4, selK = 2;
    deslizante(ctr, 'Linhas visíveis', 1, 14, 1, 8, function (v) {
      linhas = v;
      if (selN > linhas) { selN = linhas; selK = Math.min(selK, selN); }
      montar();
    });

    var tri = el('div', { class: 'triangulo' }); c.appendChild(tri);
    var painel = cartoes(c, [
      { rot: 'C(n,k) selecionado', k: 'c' },
      { rot: 'pais (Stifel)', k: 'pais' },
      { rot: 'soma da linha = 2ⁿ', k: 'soma' },
      { rot: 'termo do binômio', k: 'termo' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function montar() {
      tri.innerHTML = '';
      for (var n = 0; n <= linhas; n++) {
        var linha = el('div', { class: 'tri-linha' });
        linha.appendChild(el('span', { class: 'tri-rot', texto: 'n=' + n }));
        for (var k = 0; k <= n; k++) {
          var cel = el('button', {
            class: 'tri-cel', 'data-n': n, 'data-k': k,
            texto: String(M.binom(n, k))
          });
          cel.addEventListener('click', (function (nn, kk) {
            return function () { selN = nn; selK = kk; marcar(); };
          })(n, k));
          linha.appendChild(cel);
        }
        tri.appendChild(linha);
      }
      marcar();
    }

    function marcar() {
      tri.querySelectorAll('.tri-cel').forEach(function (cel) {
        var n = Number(cel.getAttribute('data-n')), k = Number(cel.getAttribute('data-k'));
        cel.classList.remove('sel', 'pai', 'linha-ativa');
        if (n === selN && k === selK) cel.classList.add('sel');
        else if (n === selN - 1 && (k === selK - 1 || k === selK)) cel.classList.add('pai');
        else if (n === selN) cel.classList.add('linha-ativa');
      });

      var v = M.binom(selN, selK);
      var p1 = selN > 0 ? M.binom(selN - 1, selK - 1) : 0;
      var p2 = selN > 0 ? M.binom(selN - 1, selK) : 0;

      painel({
        c: 'C(' + selN + ',' + selK + ') = ' + v,
        pais: selN === 0 ? '—' : p1 + ' + ' + p2 + ' = ' + v,
        soma: Math.pow(2, selN).toLocaleString('pt-BR'),
        termo: (v === 1 ? '' : v) + 'x<sup>' + selK + '</sup>y<sup>' + (selN - selK) + '</sup>'
      });

      saida.innerHTML =
        'A célula destacada vale <b>' + v + '</b>: é o número de maneiras de escolher <b>'
        + selK + '</b> objetos entre <b>' + selN + '</b>. '
        + (selN > 0
            ? 'As duas células acima dela — em laranja — somam exatamente esse valor: '
              + '<b>' + p1 + ' + ' + p2 + ' = ' + v + '</b>. É a <b>relação de Stifel</b>, '
              + 'e ela tem uma leitura combinatória: separe os subconjuntos conforme contenham '
              + 'ou não um elemento fixado. '
            : '')
        + 'A soma de toda a linha n = ' + selN + ' vale <b>2<sup>' + selN + '</sup> = '
        + Math.pow(2, selN).toLocaleString('pt-BR') + '</b>, o número de subconjuntos de um '
        + 'conjunto com ' + selN + ' elementos. '
        + 'E a linha inteira são os coeficientes de (x+y)<sup>' + selN + '</sup>.';
    }

    montar();
  }

  /* =================================================================
     14c. O problema do aniversário
     ================================================================= */
  function aniversarios(raiz) {
    var c = moldura(raiz, 'O problema do aniversário');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var n = 23;
    deslizante(ctr, 'Pessoas na sala', 2, 80, 1, 23, function (v) { n = v; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'P(ao menos 2 coincidirem)', k: 'p' },
      { rot: 'P(todos diferentes)', k: 'q' },
      { rot: 'pares de pessoas', k: 'pares' },
      { rot: 'n para atingir 50%', k: 'n50' },
      { rot: 'n para atingir 99%', k: 'n99' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    /* P(todos diferentes) = 365!/(365-n)! / 365^n, em logaritmos */
    function pDiferentes(m) {
      if (m > 365) return 0;
      var ln = 0;
      for (var i = 0; i < m; i++) ln += Math.log((365 - i) / 365);
      return Math.exp(ln);
    }

    var n50 = 2, n99 = 2;
    for (var m = 2; m <= 365; m++) {
      if (1 - pDiferentes(m) < 0.5) n50 = m + 1;
      if (1 - pDiferentes(m) < 0.99) n99 = m + 1;
    }

    function atualizar() {
      var q = pDiferentes(n), p = 1 - q;
      painel({
        p: M.pct(p, 2), q: M.pct(q, 2),
        pares: String(n * (n - 1) / 2),
        n50: String(n50), n99: String(n99)
      });

      var g = G.eixos(cv, {
        xmin: 0, xmax: 80, ymin: 0, ymax: 1, altura: 240,
        rotX: 'número de pessoas na sala', rotY: 'P(ao menos duas coincidirem)',
        marcasX: G.marcasLineares(0, 80, 8, 0),
        formataY: function (v) { return (100 * v).toFixed(0) + '%'; }
      });
      G.area(g, function (x) { return 1 - pDiferentes(Math.round(x)); }, 0, n,
             'rgba(44,95,141,.22)');
      G.curva(g, function (x) { return 1 - pDiferentes(Math.round(x)); }, G.COR.vinho, 2.4);
      var ct = g.ct;
      ct.strokeStyle = '#c9d2db'; ct.setLineDash([4, 4]); ct.lineWidth = 1;
      ct.beginPath(); ct.moveTo(g.x0, g.Y(0.5)); ct.lineTo(g.x1, g.Y(0.5)); ct.stroke();
      ct.setLineDash([]);
      G.vertical(g, n, G.COR.azul, 'n = ' + n);
      ct.fillStyle = G.COR.vinho;
      ct.beginPath(); ct.arc(g.X(n), g.Y(p), 4, 0, 2 * Math.PI); ct.fill();

      saida.innerHTML = 'Com <b>' + n + '</b> pessoas há <b>' + (n * (n - 1) / 2)
        + '</b> pares possíveis, e a probabilidade de alguma coincidência é <b>'
        + M.pct(p, 1) + '</b>. '
        + (n >= n50
            ? 'Já passamos de 50% — e bastaram <b>' + n50 + '</b> pessoas para isso.'
            : 'Aumente até <b>' + n50 + '</b> pessoas e a probabilidade ultrapassa 50%.')
        + ' A intuição falha porque pensamos em "alguém com o <i>meu</i> aniversário" '
        + '(apenas ' + (n - 1) + ' comparações) em vez de "duas pessoas quaisquer" ('
        + (n * (n - 1) / 2) + ' comparações).';
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     14b. Grade do espaço amostral de dois dados
     ================================================================= */
  var EVENTOS_DADOS = {
    igual:   { rot: 'A soma é igual a k', usaK: true,
               teste: function (i, j, k) { return i + j === k; } },
    maiorig: { rot: 'A soma é maior ou igual a k', usaK: true,
               teste: function (i, j, k) { return i + j >= k; } },
    menorig: { rot: 'A soma é menor ou igual a k', usaK: true,
               teste: function (i, j, k) { return i + j <= k; } },
    par:     { rot: 'A soma é par', usaK: false,
               teste: function (i, j) { return (i + j) % 2 === 0; } },
    dupla:   { rot: 'Os dois dados são iguais (dupla)', usaK: false,
               teste: function (i, j) { return i === j; } },
    seis:    { rot: 'Pelo menos um dado mostra 6', usaK: false,
               teste: function (i, j) { return i === 6 || j === 6; } },
    maior:   { rot: 'O dado vermelho é maior que o azul', usaK: false,
               teste: function (i, j) { return i > j; } }
  };

  function gradeDados(raiz) {
    var c = moldura(raiz, 'O espaço amostral de dois dados, célula por célula');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var evento = 'igual', k = 7;

    var campoSel = el('div', { class: 'campo', style: 'flex:2 1 260px' });
    campoSel.appendChild(el('label', { html: 'Evento favorável' }));
    var sel = el('select');
    Object.keys(EVENTOS_DADOS).forEach(function (key) {
      sel.appendChild(el('option', { value: key, texto: EVENTOS_DADOS[key].rot }));
    });
    campoSel.appendChild(sel); ctr.appendChild(campoSel);
    sel.addEventListener('change', function () { evento = sel.value; atualizar(); });

    var slK = deslizante(ctr, 'valor de k', 2, 12, 1, 7, function (v) { k = v; atualizar(); });
    var campoK = slK.parentNode;

    var grade = el('div', { class: 'grade-dados' }); c.appendChild(grade);
    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Distribuição da soma &nbsp;·&nbsp; em destaque, as somas que pertencem ao evento' }));
    var painel = cartoes(c, [
      { rot: 'casos favoráveis |A|', k: 'fav' },
      { rot: 'casos possíveis |Ω|', k: 'tot' },
      { rot: 'P(A) = |A|/|Ω|', k: 'p' },
      { rot: 'em porcentagem', k: 'pc' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    /* desenha a grade 7x7 (cabeçalhos + 36 células) */
    function montarGrade() {
      grade.innerHTML = '';
      grade.appendChild(el('div', { class: 'gd-canto', html: '+' }));
      for (var j = 1; j <= 6; j++) {
        grade.appendChild(el('div', { class: 'gd-cab gd-azul', texto: String(j) }));
      }
      for (var i = 1; i <= 6; i++) {
        grade.appendChild(el('div', { class: 'gd-cab gd-vermelho', texto: String(i) }));
        for (var jj = 1; jj <= 6; jj++) {
          grade.appendChild(el('div', {
            class: 'gd-cel', 'data-i': i, 'data-j': jj,
            html: '<span class="gd-soma">' + (i + jj) + '</span>'
                + '<span class="gd-par">(' + i + ',' + jj + ')</span>'
          }));
        }
      }
    }

    function atualizar() {
      var ev = EVENTOS_DADOS[evento];
      campoK.style.display = ev.usaK ? '' : 'none';

      var fav = 0, porSoma = {};
      for (var s = 2; s <= 12; s++) porSoma[s] = false;
      grade.querySelectorAll('.gd-cel').forEach(function (cel) {
        var i = Number(cel.getAttribute('data-i')), j = Number(cel.getAttribute('data-j'));
        var ok = ev.teste(i, j, k);
        cel.classList.toggle('favoravel', ok);
        if (ok) { fav++; porSoma[i + j] = true; }
      });

      painel({ fav: String(fav), tot: '36', p: fav + '/36', pc: M.pct(fav / 36, 1) });

      /* distribuição da soma, com as somas do evento em destaque */
      var dados = [], ymax = 6;
      for (var t = 2; t <= 12; t++) dados.push({ x: t, y: 6 - Math.abs(t - 7) });
      var g = G.eixos(cv, {
        xmin: 1.4, xmax: 12.6, ymax: ymax * 1.16, altura: 190,
        rotX: 'soma dos dois dados', rotY: 'nº de pares',
        marcasX: G.marcasInteiras(2, 12, 11), divY: 6,
        formataY: function (v) { return String(Math.round(v)); }
      });
      G.barras(g, dados.filter(function (d) { return !porSoma[d.x]; }), '#c9d6e2', 0.74);
      G.barras(g, dados.filter(function (d) { return porSoma[d.x]; }), G.COR.vinho, 0.74);

      var mdc = (function (a, b) { while (b) { var t2 = a % b; a = b; b = t2; } return a; })(fav, 36);
      var fracao = fav === 0 ? '0' : (fav / mdc) + '/' + (36 / mdc);

      saida.innerHTML = fav === 0
        ? 'Nenhuma célula satisfaz o evento: ele é <b>impossível</b>, e P(A) = 0.'
        : 'Há <b>' + fav + '</b> células destacadas entre as <b>36</b> do quadro, portanto '
          + 'P(A) = ' + fav + '/36 = <b>' + fracao + '</b> ≈ <b>' + M.pct(fav / 36, 1) + '</b>. '
          + (fav === 36 ? 'Todas as células: o evento é <b>certo</b>. ' : '')
          + 'Repare que <b>cada célula vale 1/36</b> — são elas as equiprováveis, '
          + 'e não as onze somas possíveis.';
    }

    montarGrade();
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     15. Da população à distribuição amostral da média
     ================================================================= */
  var POPULACOES = {
    normal: {
      rot: 'Normal (μ=50, σ=10)', mu: 50, sg: 10, lo: 10, hi: 90,
      dens: function (x) { return M.dNormal(x, 50, 10); },
      sorteia: function () { return 50 + 10 * M.normalAleatoria(); }
    },
    uniforme: {
      rot: 'Uniforme em [30, 70]', mu: 50, sg: 40 / Math.sqrt(12), lo: 25, hi: 75,
      dens: function (x) { return (x >= 30 && x <= 70) ? 1 / 40 : 0; },
      sorteia: function () { return 30 + 40 * Math.random(); }
    },
    exponencial: {
      rot: 'Exponencial (média 50)', mu: 50, sg: 50, lo: 0, hi: 220,
      dens: function (x) { return x < 0 ? 0 : Math.exp(-x / 50) / 50; },
      sorteia: function () { return -50 * Math.log(Math.random() || 1e-12); }
    },
    bimodal: {
      rot: 'Bimodal (dois picos)', mu: 50, sg: Math.sqrt(250), lo: 10, hi: 90,
      dens: function (x) { return 0.5 * M.dNormal(x, 35, 5) + 0.5 * M.dNormal(x, 65, 5); },
      sorteia: function () {
        return (Math.random() < 0.5 ? 35 : 65) + 5 * M.normalAleatoria();
      }
    }
  };

  function amostragem(raiz) {
    var c = moldura(raiz, 'Da população à distribuição amostral da média');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'normal', nAm = 5;
    var campoSel = el('div', { class: 'campo' });
    campoSel.appendChild(el('label', { html: 'População' }));
    var sel = el('select');
    Object.keys(POPULACOES).forEach(function (k) {
      sel.appendChild(el('option', { value: k, texto: POPULACOES[k].rot }));
    });
    campoSel.appendChild(sel); ctr.appendChild(campoSel);
    sel.addEventListener('change', function () { chave = sel.value; zerar(); });

    deslizante(ctr, 'Tamanho da amostra n', 1, 50, 1, 5, function (v) { nAm = v; zerar(); });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cvP = el('canvas'); c.appendChild(cvP);
    c.appendChild(el('div', { class: 'legenda', html:
      'População &nbsp;·&nbsp; os traços embaixo são a última amostra sorteada' }));
    var cvA = el('canvas'); c.appendChild(cvA);
    c.appendChild(el('div', { class: 'legenda', html:
      'Distribuição das médias amostrais &nbsp;·&nbsp; curva vermelha: a normal prevista pelo TCL' }));

    var painel = cartoes(c, [
      { rot: 'μ da população', k: 'mu' }, { rot: 'σ da população', k: 'sg' },
      { rot: 'erro padrão σ/√n', k: 'ep' }, { rot: 'amostras geradas', k: 'q' },
      { rot: 'média das médias', k: 'mo' }, { rot: 'desvio das médias', k: 'so' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var caixas = new Array(46).fill(0), total = 0, soma = 0, soma2 = 0, ultima = [];

    function simular(q) {
      var P = POPULACOES[chave];
      var ep = P.sg / Math.sqrt(nAm);
      var lo = P.mu - 4.2 * ep, hi = P.mu + 4.2 * ep;
      for (var i = 0; i < q; i++) {
        var am = [], s = 0;
        for (var j = 0; j < nAm; j++) { var v = P.sorteia(); am.push(v); s += v; }
        var md = s / nAm;
        soma += md; soma2 += md * md; total++;
        var idx = Math.floor((md - lo) / (hi - lo) * caixas.length);
        if (idx >= 0 && idx < caixas.length) caixas[idx]++;
        if (i === q - 1) ultima = am;
      }
      desenhar();
    }

    function zerar() {
      caixas = new Array(46).fill(0); total = 0; soma = 0; soma2 = 0; ultima = [];
      desenhar();
    }

    function desenhar() {
      var P = POPULACOES[chave];

      /* ---- população ---- */
      var pico = 0;
      for (var t = P.lo; t <= P.hi; t += (P.hi - P.lo) / 200) pico = Math.max(pico, P.dens(t));
      var gp = G.eixos(cvP, {
        xmin: P.lo, xmax: P.hi, ymax: pico * 1.25, altura: 190,
        rotX: 'valor na população', rotY: 'densidade',
        marcasX: G.marcasLineares(P.lo, P.hi, 6, 0),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      G.area(gp, P.dens, P.lo, P.hi, 'rgba(44,95,141,.14)');
      G.curva(gp, P.dens, G.COR.azul, 2);
      G.vertical(gp, P.mu, G.COR.ambar, 'μ');
      var ctp = gp.ct;
      ctp.strokeStyle = G.COR.vinho; ctp.lineWidth = 1.5;
      ultima.forEach(function (v) {
        if (v < gp.xmin || v > gp.xmax) return;
        ctp.beginPath();
        ctp.moveTo(gp.X(v), gp.y1); ctp.lineTo(gp.X(v), gp.y1 - 11);
        ctp.stroke();
      });

      /* ---- distribuição amostral ---- */
      var ep = P.sg / Math.sqrt(nAm);
      var lo = P.mu - 4.2 * ep, hi = P.mu + 4.2 * ep;
      var larg = (hi - lo) / caixas.length;
      var dens = caixas.map(function (q) { return total ? q / (total * larg) : 0; });
      var picoA = M.dNormal(P.mu, P.mu, ep);
      var ymax = Math.max(picoA, Math.max.apply(null, dens)) * 1.18;

      var ga = G.eixos(cvA, {
        xmin: lo, xmax: hi, ymax: ymax, altura: 230,
        rotX: 'média da amostra x̄', rotY: 'densidade',
        marcasX: G.marcasLineares(lo, hi, 6, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var cta = ga.ct;
      cta.fillStyle = G.COR.azulClaro;
      dens.forEach(function (d, i) {
        if (d <= 0) return;
        var x0 = ga.X(lo + i * larg), x1 = ga.X(lo + (i + 1) * larg);
        var y = ga.Y(Math.min(d, ga.ymax));
        cta.fillRect(x0 + 0.4, y, Math.max(1, x1 - x0 - 0.8), ga.y1 - y);
      });
      G.curva(ga, function (x) { return M.dNormal(x, P.mu, ep); }, G.COR.vinho, 2.2);
      G.vertical(ga, P.mu, G.COR.ambar, 'μ');

      var mo = total ? soma / total : 0;
      var so = total > 1 ? Math.sqrt(Math.max(0, soma2 / total - mo * mo)) : 0;
      painel({
        mu: M.fmt(P.mu, 2), sg: M.fmt(P.sg, 3), ep: M.fmt(ep, 3),
        q: total.toLocaleString('pt-BR'),
        mo: total ? M.fmt(mo, 3) : '—', so: total > 1 ? M.fmt(so, 3) : '—'
      });

      saida.innerHTML = total === 0
        ? 'Os dois gráficos estão na <b>mesma escala de valores?</b> Não — repare nos eixos. '
          + 'A população vai de ' + M.fmt(P.lo, 0) + ' a ' + M.fmt(P.hi, 0)
          + ', mas as médias de n = ' + nAm + ' se concentram entre ' + M.fmt(lo, 1)
          + ' e ' + M.fmt(hi, 1) + '. Sorteie amostras para ver.'
        : 'Depois de <b>' + total.toLocaleString('pt-BR') + '</b> amostras de tamanho n = <b>'
          + nAm + '</b>: as médias se agrupam em <b>' + M.fmt(mo, 3) + '</b> (a teoria prevê μ = '
          + M.fmt(P.mu, 2) + ') com dispersão <b>' + M.fmt(so, 3) + '</b> (a teoria prevê '
          + 'σ/√n = ' + M.fmt(ep, 3) + '). A população tem σ = ' + M.fmt(P.sg, 2)
          + ', ou seja, as médias são <b>' + M.fmt(P.sg / ep, 1) + ' vezes</b> menos dispersas '
          + 'que os valores individuais.';
    }

    botao(bts, '+1 amostra', function () { simular(1); });
    botao(bts, '+1 000', function () { simular(1000); });
    botao(bts, '+50 000', function () { simular(50000); });
    botao(bts, 'Zerar', zerar, true);

    registrarRedesenho(desenhar);
  }

  /* =================================================================
     16. t de Student contra a normal
     ================================================================= */
  function tstudent(raiz) {
    var c = moldura(raiz, 't de Student: a cauda mais pesada e o preço de estimar σ');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var gl = 5, conf = 0.95;
    deslizante(ctr, 'Graus de liberdade ν = n−1', 1, 60, 1, 5, function (v) { gl = v; atualizar(); });
    var campoC = el('div', { class: 'campo' });
    campoC.appendChild(el('label', { html: 'Nível de confiança' }));
    var selC = el('select');
    [['0.90', '90%'], ['0.95', '95%'], ['0.99', '99%']].forEach(function (o) {
      selC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selC.value = '0.95';
    campoC.appendChild(selC); ctr.appendChild(campoC);
    selC.addEventListener('change', function () { conf = Number(selC.value); atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Azul: normal padrão &nbsp;·&nbsp; vermelho: t com ν graus de liberdade &nbsp;·&nbsp; '
      + 'áreas sombreadas: as duas caudas que somam 1 − confiança' }));
    var painel = cartoes(c, [
      { rot: 'z crítico', k: 'z' }, { rot: 't crítico', k: 't' },
      { rot: 'quanto maior (t/z)', k: 'r' }, { rot: 'variância da t', k: 'v' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var alfa = (1 - conf) / 2;
      var zc = M.zCritico(1 - alfa), tc = M.tCritico(alfa, gl);
      var varT = gl > 2 ? gl / (gl - 2) : Infinity;
      painel({
        z: M.fmt(zc, 4), t: M.fmt(tc, 4), r: M.fmt(tc / zc, 3),
        v: gl > 2 ? M.fmt(varT, 3) : 'infinita'
      });

      var lim = Math.max(4.4, Math.min(8, tc * 1.4));
      var g = G.eixos(cv, {
        xmin: -lim, xmax: lim, ymax: 0.45, altura: 280,
        rotX: 'desvios padrão', rotY: 'densidade',
        marcasX: G.marcasLineares(-lim, lim, 8, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var fT = function (x) { return M.dT(x, gl); };
      var fZ = function (x) { return M.dNormal(x, 0, 1); };
      G.area(g, fT, -lim, -tc, 'rgba(140,47,57,.25)');
      G.area(g, fT, tc, lim, 'rgba(140,47,57,.25)');
      G.curva(g, fZ, G.COR.azul, 2, [6, 4]);
      G.curva(g, fT, G.COR.vinho, 2.4);
      G.vertical(g, -tc, G.COR.vinho, '−t');
      G.vertical(g, tc, G.COR.vinho, '+t');
      G.vertical(g, -zc, G.COR.azul, '−z');
      G.vertical(g, zc, G.COR.azul, '+z');
      G.legenda(g, [
        { texto: 'normal padrão', cor: G.COR.azul },
        { texto: 't com ν = ' + gl, cor: G.COR.vinho }
      ]);

      saida.innerHTML = 'Com ν = <b>' + gl + '</b> graus de liberdade, o valor crítico é <b>'
        + M.fmt(tc, 3) + '</b> contra <b>' + M.fmt(zc, 3) + '</b> da normal — um intervalo <b>'
        + M.pct(tc / zc - 1, 1) + ' mais largo</b>. Essa largura extra é o preço de não conhecer '
        + 'σ e ter de estimá-lo por s. '
        + (gl >= 30
            ? 'A partir de ν ≈ 30 a diferença some, e muitos livros autorizam usar z no lugar de t.'
            : 'Aumente ν e veja a curva vermelha encostar na azul.');
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     17. Qui-quadrado
     ================================================================= */
  function quiquadrado(raiz) {
    var c = moldura(raiz, 'Distribuição qui-quadrado');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var k = 5;
    deslizante(ctr, 'Graus de liberdade k', 1, 40, 1, 5, function (v) { k = v; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Áreas sombreadas: as duas caudas de 2,5% usadas no intervalo de confiança da variância' }));
    var painel = cartoes(c, [
      { rot: 'média = k', k: 'm' }, { rot: 'variância = 2k', k: 'v' },
      { rot: 'χ² inferior (2,5%)', k: 'ci' }, { rot: 'χ² superior (2,5%)', k: 'cs' },
      { rot: 'χ² crítico (5% à direita)', k: 'c5' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var ci = M.quiCritico(0.975, k), cs = M.quiCritico(0.025, k), c5 = M.quiCritico(0.05, k);
      painel({ m: String(k), v: String(2 * k), ci: M.fmt(ci, 3), cs: M.fmt(cs, 3), c5: M.fmt(c5, 3) });

      var xmax = Math.max(12, k + 5 * Math.sqrt(2 * k));
      var pico = 0;
      for (var x = 0.02; x < xmax; x += xmax / 400) pico = Math.max(pico, M.dQui(x, k));
      if (k <= 2) pico = Math.min(pico, M.dQui(xmax / 40, k) * 1.5);

      var g = G.eixos(cv, {
        xmin: 0, xmax: xmax, ymax: pico * 1.2, altura: 270,
        rotX: 'χ²', rotY: 'densidade',
        marcasX: G.marcasLineares(0, xmax, 6, 0),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var f = function (x) { return M.dQui(x, k); };
      G.area(g, f, 0, ci, 'rgba(140,47,57,.25)');
      G.area(g, f, cs, xmax, 'rgba(140,47,57,.25)');
      G.curva(g, f, G.COR.vinho, 2.4);
      G.vertical(g, k, G.COR.ambar, 'k');
      G.vertical(g, ci, G.COR.azul, '2,5%');
      G.vertical(g, cs, G.COR.azul, '97,5%');

      saida.innerHTML = 'A qui-quadrado só assume valores <b>positivos</b> e é '
        + '<b>assimétrica à direita</b>. Com k = ' + k + ', a média é <b>' + k
        + '</b> e a variância, <b>' + 2 * k + '</b>. '
        + (k >= 25
            ? 'Para k grande ela vai ficando simétrica — é o TCL agindo, já que χ² é uma soma de k parcelas independentes.'
            : 'Aumente k e veja a assimetria diminuir: χ² é a soma de k quadrados de normais padrão independentes.');
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Registro e inicialização
     ================================================================= */
  var REGISTRO = {
    dados2: dadosDois, eventos: eventos, encontro: encontro, contagem: contagem,
    bayes: bayes, discreta: discreta, binomial: binomial, poisson: poisson,
    normal: normal, tcl: tcl, passeio: passeio, moeda: moeda, exponencial: exponencial,
    descritiva: descritiva, amostragem: amostragem, tstudent: tstudent,
    quiquadrado: quiquadrado, gradedados: gradeDados,
    pascal: pascal, aniversarios: aniversarios, montyhall: montyhall
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-widget]').forEach(function (n) {
      var f = REGISTRO[n.getAttribute('data-widget')];
      if (f) {
        try { f(n); }
        catch (e) {
          n.innerHTML = '<div class="saida">Não foi possível carregar este componente.</div>';
          if (window.console) console.error(e);
        }
      }
    });
  });
})();
