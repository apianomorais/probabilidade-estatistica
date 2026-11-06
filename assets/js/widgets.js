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

    var modo = 'contagem';   /* 'contagem' ou 'prob' */

    var campoModo = el('div', { class: 'campo', style: 'flex:1 1 230px' });
    campoModo.appendChild(el('label', { html: 'O que você vai digitar na 2ª linha' }));
    var sel = el('select');
    sel.appendChild(el('option', { value: 'contagem',
      texto: 'Contagens (frequências) — normalizo para você' }));
    sel.appendChild(el('option', { value: 'prob',
      texto: 'Probabilidades (devem somar 1)' }));
    campoModo.appendChild(sel); ctr.appendChild(campoModo);
    sel.addEventListener('change', function () {
      modo = sel.value;
      rotuloP.innerHTML = modo === 'contagem'
        ? 'Contagens f<sub>i</sub> (quantas vezes cada valor ocorreu)'
        : 'Probabilidades P<sub>i</sub>';
      iP.value = modo === 'contagem' ? '50, 25, 25' : '0,5 · 0,25 · 0,25';
      if (modo === 'prob') iP.value = '0.5, 0.25, 0.25';
      atualizar();
    });

    var iX = numero(ctr, 'Valores x<sub>i</sub> (separados por vírgula)', '', atualizar, { type: 'text' });
    var iP = numero(ctr, 'Contagens f<sub>i</sub> (quantas vezes cada valor ocorreu)', '',
                    atualizar, { type: 'text' });
    var rotuloP = iP.parentNode.querySelector('label');
    iX.value = '0, 1, 2'; iP.value = '50, 25, 25';

    var exemplos = el('div', { class: 'botoes', style: 'margin:.1rem 0 .9rem' });
    c.appendChild(exemplos);
    [
      ['Dado honesto', '1,2,3,4,5,6', '1,1,1,1,1,1'],
      ['Irmãos (Módulo 6)', '0,1,2,3,4', '5,10,7,2,1'],
      ['Soma de 2 dados', '2,3,4,5,6,7,8,9,10,11,12', '1,2,3,4,5,6,5,4,3,2,1'],
      ['Exemplo 4.1', '0,1,2', '50,25,25']
    ].forEach(function (ex) {
      botao(exemplos, ex[0], function () {
        if (modo !== 'contagem') { modo = 'contagem'; sel.value = 'contagem';
          rotuloP.innerHTML = 'Contagens f<sub>i</sub> (quantas vezes cada valor ocorreu)'; }
        iX.value = ex[1]; iP.value = ex[2]; atualizar();
      }, true);
    });

    var cv = el('canvas'); c.appendChild(cv);
    var tabela = el('div', { class: 'tabela-rolavel' }); c.appendChild(tabela);
    var painel = cartoes(c, [
      { rot: 'total N = Σf<sub>i</sub>', k: 'n' }, { rot: 'Σ P<sub>i</sub>', k: 's' },
      { rot: '⟨x⟩', k: 'm' }, { rot: '⟨x²⟩', k: 'm2' },
      { rot: 'σ² = ⟨x²⟩−⟨x⟩²', k: 'v' }, { rot: 'σ', k: 'd' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return !isNaN(v); });
    }

    function atualizar() {
      var xs = ler(iX.value), fs = ler(iP.value);
      var n = Math.min(xs.length, fs.length);
      if (n === 0) {
        saida.innerHTML = 'Informe ao menos um valor e a contagem correspondente.';
        painel({ n: '—', s: '—', m: '—', m2: '—', v: '—', d: '—' });
        tabela.innerHTML = '';
        G.preparar(cv, 240);
        return;
      }
      xs = xs.slice(0, n); fs = fs.slice(0, n);

      if (fs.some(function (f) { return f < 0; })) {
        saida.innerHTML = '<b style="color:#8c2f39">Há valor negativo na segunda linha.</b> '
          + (modo === 'contagem'
              ? 'Contagens não podem ser negativas.'
              : 'Probabilidade negativa viola o Axioma 1 (Módulo 1).');
        painel({ n: '—', s: '—', m: '—', m2: '—', v: '—', d: '—' });
        tabela.innerHTML = '';
        G.preparar(cv, 240);
        return;
      }

      var total = 0;
      fs.forEach(function (f) { total += f; });
      if (total === 0) {
        saida.innerHTML = 'A soma da segunda linha é zero — não há o que normalizar.';
        painel({ n: '0', s: '—', m: '—', m2: '—', v: '—', d: '—' });
        tabela.innerHTML = ''; G.preparar(cv, 240);
        return;
      }

      /* no modo contagem, normaliza dividindo pelo total */
      var ps = modo === 'contagem'
        ? fs.map(function (f) { return f / total; })
        : fs.slice();

      var somaP = 0, m = 0, m2 = 0;
      for (var i = 0; i < n; i++) {
        somaP += ps[i];
        m += xs[i] * ps[i];
        m2 += xs[i] * xs[i] * ps[i];
      }
      var v = m2 - m * m, d = Math.sqrt(Math.max(0, v));

      painel({
        n: modo === 'contagem' ? M.fmt(total, 0) : '—',
        s: M.fmt(somaP, 4), m: M.fmt(m, 4), m2: M.fmt(m2, 4),
        v: M.fmt(v, 4), d: M.fmt(d, 4)
      });

      montarTabela(xs, fs, ps, total, m);

      var msg;
      if (modo === 'contagem') {
        msg = 'Total de <b>' + M.fmt(total, 0) + '</b> observações. Cada probabilidade foi '
            + 'obtida dividindo a contagem pelo total: '
            + '<b>P<sub>i</sub> = f<sub>i</sub>/N</b>. Assim ΣP<sub>i</sub> = 1 '
            + '<b>por construção</b> — a normalização é automática. ';
      } else if (Math.abs(somaP - 1) > 1e-6) {
        msg = '<b style="color:#8c2f39">ΣP<sub>i</sub> = ' + M.fmt(somaP, 4) + ' ≠ 1.</b> '
            + 'A distribuição não está normalizada, e os momentos perdem o sentido. '
            + 'Troque para o modo <i>contagens</i> acima e eu normalizo os mesmos números. ';
        saida.innerHTML = msg;
        desenhar(xs, ps, m, d);
        return;
      } else {
        msg = 'Distribuição normalizada corretamente. ';
      }

      var possivel = xs.some(function (x) { return Math.abs(x - m) < 1e-9; });
      msg += '⟨x⟩ = <b>' + M.fmt(m, 4) + '</b> e σ = <b>' + M.fmt(d, 4) + '</b>. '
           + (possivel
               ? 'Aqui a média coincide com um dos valores possíveis.'
               : '<b>A média não é um dos valores possíveis</b> — como nos 2,4 filhos por família.');
      saida.innerHTML = msg;
      desenhar(xs, ps, m, d);
    }

    function montarTabela(xs, fs, ps, total, m) {
      var linhas = '';
      for (var i = 0; i < xs.length; i++) {
        linhas += '<tr><td class="num">' + M.fmt(xs[i], 0) + '</td>'
                + (modo === 'contagem' ? '<td class="num">' + M.fmt(fs[i], 0) + '</td>' : '')
                + '<td class="num">' + M.fmt(ps[i], 4) + '</td>'
                + '<td class="num">' + M.fmt(xs[i] * ps[i], 4) + '</td>'
                + '<td class="num">' + M.fmt(xs[i] * xs[i] * ps[i], 4) + '</td></tr>';
      }
      var somaXP = 0, somaX2P = 0;
      for (var j = 0; j < xs.length; j++) {
        somaXP += xs[j] * ps[j]; somaX2P += xs[j] * xs[j] * ps[j];
      }
      tabela.innerHTML =
        '<table><thead><tr><th class="num">x<sub>i</sub></th>'
        + (modo === 'contagem' ? '<th class="num">f<sub>i</sub></th>' : '')
        + '<th class="num">P<sub>i</sub></th><th class="num">x<sub>i</sub>P<sub>i</sub></th>'
        + '<th class="num">x<sub>i</sub>²P<sub>i</sub></th></tr></thead><tbody>'
        + linhas
        + '<tr><th class="num">Σ</th>'
        + (modo === 'contagem' ? '<th class="num">' + M.fmt(total, 0) + '</th>' : '')
        + '<th class="num">1</th><th class="num">' + M.fmt(somaXP, 4) + '</th>'
        + '<th class="num">' + M.fmt(somaX2P, 4) + '</th></tr>'
        + '</tbody></table>';
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
     12a. Galton: a tábua de pregos
     ================================================================= */
  function galton(raiz) {
    var c = moldura(raiz, 'A tábua de Galton: a binomial construída bola a bola');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var fileiras = 12, p = 0.5;
    deslizante(ctr, 'Fileiras de pregos', 4, 20, 1, 12, function (v) {
      fileiras = v; zerar();
    });
    deslizante(ctr, 'p (desvio à direita)', 0.1, 0.9, 0.05, 0.5, function (v) {
      p = v; zerar();
    }, function (v) { return v.toFixed(2).replace('.', ','); });
    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Cada bola desvia à direita com probabilidade p, em cada prego &nbsp;·&nbsp; '
      + 'curva vermelha: a binomial teórica' }));
    var painel = cartoes(c, [
      { rot: 'bolas lançadas', k: 'n' },
      { rot: 'média teórica np', k: 'mt' },
      { rot: 'média observada', k: 'mo' },
      { rot: 'σ teórico', k: 'st' },
      { rot: 'σ observado', k: 'so' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var baldes = [], total = 0, soma = 0, soma2 = 0;

    function zerar() {
      baldes = new Array(fileiras + 1).fill(0);
      total = 0; soma = 0; soma2 = 0; desenhar();
    }

    function soltar(q) {
      for (var i = 0; i < q; i++) {
        var k = 0;
        for (var f = 0; f < fileiras; f++) if (Math.random() < p) k++;
        baldes[k]++; total++; soma += k; soma2 += k * k;
      }
      desenhar();
    }

    function desenhar() {
      if (baldes.length !== fileiras + 1) baldes = new Array(fileiras + 1).fill(0);
      var pic = G.preparar(cv, 330), ct = pic.ct, L = pic.L, A = pic.A;

      var alturaPregos = Math.min(A * 0.46, fileiras * 13 + 20);
      var passo = Math.min(18, (L - 60) / (fileiras + 1));
      var cx = L / 2, topo = 16;

      /* pregos */
      ct.fillStyle = '#b9c5d1';
      for (var f = 0; f < fileiras; f++) {
        for (var j = 0; j <= f; j++) {
          var x = cx + (j - f / 2) * passo;
          var y = topo + (f + 0.5) * (alturaPregos / fileiras);
          ct.beginPath(); ct.arc(x, y, 1.9, 0, 2 * Math.PI); ct.fill();
        }
      }

      /* colunas acumuladas */
      var baseY = A - 26;
      var topoCol = topo + alturaPregos + 10;
      var maxB = Math.max(1, Math.max.apply(null, baldes));
      var alturaMax = baseY - topoCol;
      var larg = Math.max(3, passo * 0.82);

      for (var k = 0; k <= fileiras; k++) {
        var xk = cx + (k - fileiras / 2) * passo;
        var h = (baldes[k] / maxB) * alturaMax;
        ct.fillStyle = G.COR.azulClaro;
        ct.fillRect(xk - larg / 2, baseY - h, larg, h);
      }

      /* binomial teórica, na mesma escala */
      var picoTeo = 0;
      for (var m = 0; m <= fileiras; m++) picoTeo = Math.max(picoTeo, M.pBinomial(fileiras, m, p));
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.2; ct.beginPath();
      for (var m2 = 0; m2 <= fileiras; m2++) {
        var xm = cx + (m2 - fileiras / 2) * passo;
        var ym = baseY - (M.pBinomial(fileiras, m2, p) / picoTeo) * alturaMax;
        if (m2 === 0) ct.moveTo(xm, ym); else ct.lineTo(xm, ym);
      }
      ct.stroke();

      /* base e rótulos */
      ct.strokeStyle = '#9aa6b2'; ct.lineWidth = 1;
      ct.beginPath(); ct.moveTo(20, baseY + 0.5); ct.lineTo(L - 20, baseY + 0.5); ct.stroke();
      ct.fillStyle = G.COR.suave; ct.font = '9px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      var salto = fileiras > 14 ? 2 : 1;
      for (var r = 0; r <= fileiras; r += salto) {
        ct.fillText(String(r), cx + (r - fileiras / 2) * passo, baseY + 4);
      }
      ct.font = '600 10px system-ui, sans-serif';
      ct.fillText('k = número de desvios à direita', cx, baseY + 15);

      var mt = fileiras * p, st = Math.sqrt(fileiras * p * (1 - p));
      var mo = total ? soma / total : 0;
      var so = total > 1 ? Math.sqrt(Math.max(0, soma2 / total - mo * mo)) : 0;
      painel({
        n: total.toLocaleString('pt-BR'), mt: M.fmt(mt, 2),
        mo: total ? M.fmt(mo, 3) : '—', st: M.fmt(st, 3),
        so: total > 1 ? M.fmt(so, 3) : '—'
      });

      saida.innerHTML = total === 0
        ? 'Cada bola encontra <b>' + fileiras + '</b> pregos e, em cada um, desvia à direita com '
          + 'probabilidade <b>' + M.fmt(p, 2) + '</b>. O balde em que ela cai é o número de '
          + 'desvios à direita — ou seja, uma variável <b>binomial</b>. Solte algumas bolas.'
        : '<b>' + total.toLocaleString('pt-BR') + '</b> bolas. Média observada <b>'
          + M.fmt(mo, 3) + '</b> (teoria: np = ' + M.fmt(mt, 2) + '); dispersão <b>'
          + M.fmt(so, 3) + '</b> (teoria: √(np(1−p)) = ' + M.fmt(st, 3) + '). '
          + 'Nenhuma bola "sabe" da binomial — ela emerge de ' + fileiras
          + ' decisões independentes repetidas muitas vezes.';
    }

    botao(bts, '+1 bola', function () { soltar(1); });
    botao(bts, '+500', function () { soltar(500); });
    botao(bts, '+20 000', function () { soltar(20000); });
    botao(bts, 'Zerar', zerar, true);

    zerar();
    registrarRedesenho(desenhar);
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
     18. Cem intervalos de confiança
     ================================================================= */
  function intervalos(raiz) {
    var c = moldura(raiz, 'O que "95% de confiança" realmente significa');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var MU = 100, SIGMA = 15;
    var nAm = 25, conf = 0.95, usaT = true;

    deslizante(ctr, 'Tamanho da amostra n', 2, 100, 1, 25, function (v) { nAm = v; gerar(); });

    var campoC = el('div', { class: 'campo' });
    campoC.appendChild(el('label', { html: 'Nível de confiança' }));
    var selC = el('select');
    [['0.80', '80%'], ['0.90', '90%'], ['0.95', '95%'], ['0.99', '99%']].forEach(function (o) {
      selC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selC.value = '0.95';
    campoC.appendChild(selC); ctr.appendChild(campoC);
    selC.addEventListener('change', function () { conf = Number(selC.value); gerar(); });

    var campoT = el('div', { class: 'campo' });
    campoT.appendChild(el('label', { html: 'σ é conhecido?' }));
    var selT = el('select');
    selT.appendChild(el('option', { value: 't', texto: 'Não — usar s e a t de Student' }));
    selT.appendChild(el('option', { value: 'z', texto: 'Sim — usar σ e a normal' }));
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () { usaT = selT.value === 't'; gerar(); });

    var bts = el('div', { class: 'botoes' }); ctr.appendChild(bts);

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Cada linha é um intervalo construído a partir de uma amostra diferente da <b>mesma</b> '
      + 'população &nbsp;·&nbsp; em vermelho, os que erraram μ' }));
    var painel = cartoes(c, [
      { rot: 'intervalos gerados', k: 'n' },
      { rot: 'acertaram μ', k: 'ok' },
      { rot: 'erraram μ', k: 'erro' },
      { rot: 'taxa de acerto', k: 'taxa' },
      { rot: 'largura média', k: 'larg' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var lista = [], acum = { n: 0, ok: 0 };

    function umIntervalo() {
      var am = [], s = 0;
      for (var i = 0; i < nAm; i++) { var x = MU + SIGMA * M.normalAleatoria(); am.push(x); s += x; }
      var media = s / nAm;
      var sq = 0;
      am.forEach(function (x) { sq += (x - media) * (x - media); });
      var dp = Math.sqrt(sq / (nAm - 1));
      var alfa = (1 - conf) / 2;
      var crit, erroPadrao;
      if (usaT) { crit = M.tCritico(alfa, nAm - 1); erroPadrao = dp / Math.sqrt(nAm); }
      else { crit = M.zCritico(1 - alfa); erroPadrao = SIGMA / Math.sqrt(nAm); }
      var margem = crit * erroPadrao;
      return { lo: media - margem, hi: media + margem, m: media,
               ok: (media - margem) <= MU && MU <= (media + margem) };
    }

    function gerar() {
      lista = [];
      for (var i = 0; i < 100; i++) lista.push(umIntervalo());
      acum.n = 100;
      acum.ok = lista.filter(function (x) { return x.ok; }).length;
      desenhar();
    }

    function acumular(q) {
      var ok = 0;
      for (var i = 0; i < q; i++) if (umIntervalo().ok) ok++;
      acum.n += q; acum.ok += ok;
      desenhar();
    }

    function desenhar() {
      var p = G.preparar(cv, 330), ct = p.ct, L = p.L, A = p.A;
      if (!lista.length) return;

      var lo = Math.min.apply(null, lista.map(function (x) { return x.lo; }));
      var hi = Math.max.apply(null, lista.map(function (x) { return x.hi; }));
      var folga = (hi - lo) * 0.04;
      lo -= folga; hi += folga;
      var mE = 38, mD = 12, mC = 26, mB = 26;
      function X(v) { return mE + (v - lo) / (hi - lo) * (L - mE - mD); }
      var alt = (A - mC - mB) / lista.length;

      /* linha de mu */
      ct.strokeStyle = G.COR.ambar; ct.lineWidth = 2;
      ct.beginPath(); ct.moveTo(X(MU), mC - 8); ct.lineTo(X(MU), A - mB + 4); ct.stroke();
      ct.fillStyle = G.COR.ambar; ct.font = '600 11px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'bottom';
      ct.fillText('μ = ' + MU, X(MU), mC - 11);

      /* intervalos */
      lista.forEach(function (it, i) {
        var y = mC + (i + 0.5) * alt;
        ct.strokeStyle = it.ok ? 'rgba(44,95,141,.55)' : G.COR.vinho;
        ct.lineWidth = it.ok ? 1.3 : 2.1;
        ct.beginPath(); ct.moveTo(X(it.lo), y); ct.lineTo(X(it.hi), y); ct.stroke();
        ct.fillStyle = it.ok ? G.COR.azul : G.COR.vinho;
        ct.beginPath(); ct.arc(X(it.m), y, 1.5, 0, 2 * Math.PI); ct.fill();
      });

      /* escala */
      ct.strokeStyle = '#c9d2db'; ct.lineWidth = 1;
      ct.beginPath(); ct.moveTo(mE, A - mB + 4); ct.lineTo(L - mD, A - mB + 4); ct.stroke();
      ct.fillStyle = G.COR.suave; ct.font = '10px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'top';
      for (var k = 0; k <= 5; k++) {
        var v = lo + (hi - lo) * k / 5;
        ct.fillText(M.fmt(v, 0), X(v), A - mB + 8);
      }
      ct.textAlign = 'left';
      ct.fillText('amostras →', 4, mC);

      var erram = lista.filter(function (x) { return !x.ok; }).length;
      var largMedia = lista.reduce(function (a, b) { return a + (b.hi - b.lo); }, 0) / lista.length;
      painel({
        n: acum.n.toLocaleString('pt-BR'),
        ok: (acum.n - (acum.n - acum.ok)).toLocaleString('pt-BR'),
        erro: (acum.n - acum.ok).toLocaleString('pt-BR'),
        taxa: M.pct(acum.ok / acum.n, 2),
        larg: M.fmt(largMedia, 2)
      });

      saida.innerHTML =
        'Dos <b>100</b> intervalos desenhados, <b>' + erram + '</b> não contêm μ = ' + MU + '. '
        + 'Acumulando <b>' + acum.n.toLocaleString('pt-BR') + '</b> intervalos, a taxa de acerto é '
        + '<b>' + M.pct(acum.ok / acum.n, 2) + '</b> — e deve convergir para '
        + M.pct(conf, 0) + '. '
        + '<br><br><b>É isto que significa 95% de confiança:</b> o <i>procedimento</i> acerta em '
        + '95% das amostras. Um intervalo específico ou contém μ ou não contém — não há '
        + '"probabilidade 95% de μ estar dentro dele", porque μ não é aleatório: a amostra é.';
    }

    botao(bts, 'Sortear 100 novas', gerar);
    botao(bts, 'Acumular +10 000', function () { acumular(10000); }, true);
    botao(bts, 'Zerar contagem', function () {
      acum.n = 0; acum.ok = 0; gerar();
    }, true);

    gerar();
    registrarRedesenho(desenhar);
  }

  /* =================================================================
     19. Calculadora de intervalos de confiança
     ================================================================= */
  function calcIC(raiz) {
    var c = moldura(raiz, 'Calculadora de intervalos de confiança');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var tipo = 'media_s';
    var campoT = el('div', { class: 'campo', style: 'flex:2 1 260px' });
    campoT.appendChild(el('label', { html: 'O que você quer estimar' }));
    var selT = el('select');
    [['media_s', 'Média, com σ desconhecido (usa t)'],
     ['media_z', 'Média, com σ conhecido (usa z)'],
     ['prop', 'Proporção'],
     ['var', 'Variância e desvio padrão']].forEach(function (o) {
      selT.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () { tipo = selT.value; ajustar(); atualizar(); });

    var campoC = el('div', { class: 'campo' });
    campoC.appendChild(el('label', { html: 'Confiança' }));
    var selC = el('select');
    [['0.90', '90%'], ['0.95', '95%'], ['0.99', '99%']].forEach(function (o) {
      selC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selC.value = '0.95';
    campoC.appendChild(selC); ctr.appendChild(campoC);
    selC.addEventListener('change', atualizar);

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var iN = numero(ctr2, 'n (tamanho da amostra)', 25, atualizar, { min: 2, step: 1 });
    var iM = numero(ctr2, 'x̄ (média amostral)', 100, atualizar, { step: 'any' });
    var iS = numero(ctr2, 's (desvio amostral)', 15, atualizar, { step: 'any', min: 0 });
    var iK = numero(ctr2, 'sucessos observados', 60, atualizar, { min: 0, step: 1 });

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'estimativa pontual', k: 'est' },
      { rot: 'erro padrão', k: 'ep' },
      { rot: 'valor crítico', k: 'crit' },
      { rot: 'margem de erro', k: 'marg' },
      { rot: 'limite inferior', k: 'li' },
      { rot: 'limite superior', k: 'ls' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function mostrar(campo, visivel) { campo.parentNode.style.display = visivel ? '' : 'none'; }

    function ajustar() {
      mostrar(iM, tipo === 'media_s' || tipo === 'media_z');
      mostrar(iS, tipo !== 'prop');
      mostrar(iK, tipo === 'prop');
      var rotS = iS.parentNode.querySelector('label');
      rotS.innerHTML = tipo === 'media_z' ? 'σ (desvio populacional)' : 's (desvio amostral)';
    }

    function atualizar() {
      var n = Math.max(2, Math.floor(Number(iN.value) || 2));
      var conf = Number(selC.value), alfa = (1 - conf) / 2;
      var est, ep, crit, li, ls, texto, rotCrit;

      if (tipo === 'prop') {
        var k = Math.min(n, Math.max(0, Math.floor(Number(iK.value) || 0)));
        est = k / n;
        ep = Math.sqrt(est * (1 - est) / n);
        crit = M.zCritico(1 - alfa); rotCrit = 'z';
        li = est - crit * ep; ls = est + crit * ep;
        var valido = n * est >= 5 && n * (1 - est) >= 5;
        texto = 'Com <b>' + k + '</b> sucessos em <b>' + n + '</b>, a proporção estimada é <b>'
          + M.pct(est, 1) + '</b>. O intervalo de ' + M.pct(conf, 0) + ' vai de <b>'
          + M.pct(Math.max(0, li), 1) + '</b> a <b>' + M.pct(Math.min(1, ls), 1) + '</b>, '
          + 'ou seja, ' + M.pct(est, 1) + ' ± ' + M.pct(crit * ep, 1) + '. '
          + (valido ? 'As condições np̂ ≥ 5 e n(1−p̂) ≥ 5 estão satisfeitas.'
                    : '<b style="color:#8c2f39">Atenção: np̂ ou n(1−p̂) é menor que 5 — '
                      + 'a aproximação normal não é confiável aqui.</b>');
      } else if (tipo === 'var') {
        var s = Math.abs(Number(iS.value) || 0);
        var gl = n - 1;
        var qLo = M.quiCritico(alfa, gl);          /* cauda direita: alfa */
        var qHi = M.quiCritico(1 - alfa, gl);      /* cauda direita: 1-alfa */
        li = gl * s * s / qLo; ls = gl * s * s / qHi;
        est = s * s; ep = NaN; crit = qLo; rotCrit = 'χ² sup.';
        texto = 'Com s = <b>' + M.fmt(s, 3) + '</b> e n = <b>' + n + '</b> (ν = ' + gl + '), o '
          + 'intervalo de ' + M.pct(conf, 0) + ' para a <b>variância</b> vai de <b>'
          + M.fmt(li, 4) + '</b> a <b>' + M.fmt(ls, 4) + '</b>; para o <b>desvio padrão</b>, de <b>'
          + M.fmt(Math.sqrt(li), 4) + '</b> a <b>' + M.fmt(Math.sqrt(ls), 4) + '</b>. '
          + 'Note que o intervalo <b>não é simétrico</b> em torno de s² — a qui-quadrado é '
          + 'assimétrica. Esta fórmula exige população normal e é sensível a desvios dessa hipótese.';
      } else {
        var md = Number(iM.value) || 0, sd = Math.abs(Number(iS.value) || 0);
        est = md; ep = sd / Math.sqrt(n);
        if (tipo === 'media_s') { crit = M.tCritico(alfa, n - 1); rotCrit = 't (' + (n - 1) + ' gl)'; }
        else { crit = M.zCritico(1 - alfa); rotCrit = 'z'; }
        li = md - crit * ep; ls = md + crit * ep;
        texto = 'O intervalo de ' + M.pct(conf, 0) + ' para a média é <b>'
          + M.fmt(li, 4) + '</b> a <b>' + M.fmt(ls, 4) + '</b>, isto é, '
          + M.fmt(md, 3) + ' ± <b>' + M.fmt(crit * ep, 4) + '</b>. '
          + (tipo === 'media_s'
              ? 'Como σ é desconhecido, o valor crítico vem da t com ' + (n - 1) + ' graus de '
                + 'liberdade (' + M.fmt(crit, 3) + '), e não da normal ('
                + M.fmt(M.zCritico(1 - alfa), 3) + ').'
              : 'Com σ conhecido, o valor crítico vem da normal padrão.');
      }

      painel({
        est: tipo === 'prop' ? M.pct(est, 2) : M.fmt(est, 4),
        ep: isFinite(ep) ? M.fmt(ep, 4) : '—',
        crit: M.fmt(crit, 4),
        marg: tipo === 'var' ? '—'
              : (tipo === 'prop' ? M.pct(crit * ep, 2) : M.fmt(crit * ep, 4)),
        li: tipo === 'prop' ? M.pct(Math.max(0, li), 2) : M.fmt(li, 4),
        ls: tipo === 'prop' ? M.pct(Math.min(1, ls), 2) : M.fmt(ls, 4)
      });
      saida.innerHTML = texto;
      desenhar(est, li, ls, tipo);
    }

    function desenhar(est, li, ls, tp) {
      var p = G.preparar(cv, 120), ct = p.ct, L = p.L;
      var centro = tp === 'var' ? (li + ls) / 2 : est;
      var meia = Math.max(1e-9, (ls - li) / 2);
      var lo = centro - meia * 2.2, hi = centro + meia * 2.2;
      function X(v) { return 30 + (v - lo) / (hi - lo) * (L - 60); }
      var y = 52;

      ct.strokeStyle = '#c9d2db'; ct.lineWidth = 1;
      ct.beginPath(); ct.moveTo(30, y); ct.lineTo(L - 30, y); ct.stroke();

      ct.fillStyle = 'rgba(44,95,141,.2)';
      ct.fillRect(X(li), y - 17, X(ls) - X(li), 34);
      ct.strokeStyle = G.COR.azul; ct.lineWidth = 2;
      ct.beginPath();
      ct.moveTo(X(li), y - 17); ct.lineTo(X(li), y + 17);
      ct.moveTo(X(ls), y - 17); ct.lineTo(X(ls), y + 17);
      ct.stroke();

      if (tp !== 'var') {
        ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.4;
        ct.beginPath(); ct.moveTo(X(est), y - 20); ct.lineTo(X(est), y + 20); ct.stroke();
      }

      ct.font = '11px system-ui, sans-serif'; ct.textAlign = 'center';
      ct.fillStyle = G.COR.azul; ct.textBaseline = 'top';
      var fmtv = tp === 'prop'
        ? function (v) { return M.pct(v, 1); }
        : function (v) { return M.fmt(v, 3); };
      ct.fillText(fmtv(li), X(li), y + 22);
      ct.fillText(fmtv(ls), X(ls), y + 22);
      if (tp !== 'var') {
        ct.fillStyle = G.COR.vinho; ct.textBaseline = 'bottom';
        ct.fillText(fmtv(est), X(est), y - 24);
      }
    }

    ajustar();
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     20. Região crítica: o gráfico central do teste de hipóteses
     ================================================================= */
  function regiaoCritica(raiz) {
    var c = moldura(raiz, 'Região de não rejeição, valores críticos e decisão');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var dist = 'z', cauda = 'bi', alfa = 0.05, gl = 15, estat = 1.8;

    var campoD = el('div', { class: 'campo' });
    campoD.appendChild(el('label', { html: 'Distribuição de referência' }));
    var selD = el('select');
    selD.appendChild(el('option', { value: 'z', texto: 'Normal padrão (teste z)' }));
    selD.appendChild(el('option', { value: 't', texto: 't de Student (teste t)' }));
    campoD.appendChild(selD); ctr.appendChild(campoD);
    selD.addEventListener('change', function () {
      dist = selD.value; campoGL.style.display = dist === 't' ? '' : 'none'; atualizar();
    });

    var campoC = el('div', { class: 'campo' });
    campoC.appendChild(el('label', { html: 'Tipo de teste' }));
    var selC = el('select');
    [['bi', 'Bilateral  (H₁: μ ≠ μ₀)'],
     ['dir', 'Unilateral à direita  (H₁: μ > μ₀)'],
     ['esq', 'Unilateral à esquerda  (H₁: μ < μ₀)']].forEach(function (o) {
      selC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoC.appendChild(selC); ctr.appendChild(campoC);
    selC.addEventListener('change', function () { cauda = selC.value; atualizar(); });

    var campoA = el('div', { class: 'campo' });
    campoA.appendChild(el('label', { html: 'Nível α' }));
    var selA = el('select');
    [['0.10', '10%'], ['0.05', '5%'], ['0.01', '1%']].forEach(function (o) {
      selA.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selA.value = '0.05';
    campoA.appendChild(selA); ctr.appendChild(campoA);
    selA.addEventListener('change', function () { alfa = Number(selA.value); atualizar(); });

    var campoGL = el('div', { class: 'campo' });
    var slGL = deslizante(campoGL, 'graus de liberdade ν', 1, 60, 1, 15, function (v) {
      gl = v; atualizar();
    });
    ctr.appendChild(campoGL);
    campoGL.style.display = 'none';

    var slE = deslizante(ctr, 'estatística calculada', -5, 5, 0.05, 1.8, function (v) {
      estat = v; atualizar();
    }, function (v) { return v.toFixed(2).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Área azul: <b>região de não rejeição</b> de H₀ &nbsp;·&nbsp; '
      + 'área vermelha: <b>região crítica</b>, com área total α' }));
    var painel = cartoes(c, [
      { rot: 'valor(es) crítico(s)', k: 'crit' },
      { rot: 'estatística calculada', k: 'est' },
      { rot: 'valor p', k: 'p' },
      { rot: 'decisão', k: 'dec' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function densidade(x) {
      return dist === 'z' ? M.dNormal(x, 0, 1) : M.dT(x, gl);
    }
    function acumulada(x) {
      return dist === 'z' ? M.FNormal(x, 0, 1) : M.FT(x, gl);
    }
    function critico(a) {
      return dist === 'z' ? M.zCritico(1 - a) : M.tCritico(a, gl);
    }

    function atualizar() {
      var cDir = null, cEsq = null, p;
      if (cauda === 'bi') {
        cDir = critico(alfa / 2); cEsq = -cDir;
        p = 2 * (1 - acumulada(Math.abs(estat)));
      } else if (cauda === 'dir') {
        cDir = critico(alfa);
        p = 1 - acumulada(estat);
      } else {
        cEsq = -critico(alfa);
        p = acumulada(estat);
      }

      var rejeita = (cDir !== null && estat > cDir) || (cEsq !== null && estat < cEsq);

      var lim = Math.max(4.2, Math.abs(estat) + 1.2,
                         (cDir !== null ? cDir : 0) + 1, Math.abs(cEsq !== null ? cEsq : 0) + 1);
      var g = G.eixos(cv, {
        xmin: -lim, xmax: lim, ymax: densidade(0) * 1.3, altura: 300,
        rotX: dist === 'z' ? 'z' : 't', rotY: 'densidade sob H₀',
        marcasX: G.marcasLineares(-lim, lim, 8, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });

      /* região de NÃO rejeição (azul) */
      var naoLo = cEsq !== null ? cEsq : -lim;
      var naoHi = cDir !== null ? cDir : lim;
      G.area(g, densidade, naoLo, naoHi, 'rgba(44,95,141,.20)');
      /* região crítica (vermelha) */
      if (cEsq !== null) G.area(g, densidade, -lim, cEsq, 'rgba(140,47,57,.34)');
      if (cDir !== null) G.area(g, densidade, cDir, lim, 'rgba(140,47,57,.34)');

      G.curva(g, densidade, G.COR.tinta, 2);

      var ct = g.ct;
      /* fronteiras */
      [[cEsq, '−crítico'], [cDir, '+crítico']].forEach(function (par) {
        if (par[0] === null) return;
        G.vertical(g, par[0], G.COR.vinho, M.fmt(par[0], 3), false);
      });
      /* estatística calculada */
      ct.save();
      ct.strokeStyle = rejeita ? G.COR.vinho : G.COR.verde;
      ct.lineWidth = 3;
      ct.beginPath();
      ct.moveTo(g.X(estat), g.y1); ct.lineTo(g.X(estat), g.Y(densidade(estat)) - 16);
      ct.stroke();
      ct.fillStyle = ct.strokeStyle;
      ct.beginPath();
      ct.moveTo(g.X(estat), g.Y(densidade(estat)) - 20);
      ct.lineTo(g.X(estat) - 5, g.Y(densidade(estat)) - 10);
      ct.lineTo(g.X(estat) + 5, g.Y(densidade(estat)) - 10);
      ct.closePath(); ct.fill();
      ct.font = '600 11px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'bottom';
      ct.fillText('calculado: ' + M.fmt(estat, 2), g.X(estat), g.Y(densidade(estat)) - 23);
      ct.restore();

      /* rótulos das regiões */
      ct.font = '600 10px system-ui, sans-serif';
      ct.textAlign = 'center'; ct.textBaseline = 'middle';
      ct.fillStyle = '#2c5f8d';
      ct.fillText('NÃO REJEITAR H₀', g.X((naoLo + naoHi) / 2), g.y1 - 16);
      if (cDir !== null && g.X(lim) - g.X(cDir) > 46) {
        ct.fillStyle = '#8c2f39';
        ct.fillText('REJEITAR', (g.X(cDir) + g.x1) / 2, g.y1 - 16);
      }
      if (cEsq !== null && g.X(cEsq) - g.x0 > 46) {
        ct.fillStyle = '#8c2f39';
        ct.fillText('REJEITAR', (g.x0 + g.X(cEsq)) / 2, g.y1 - 16);
      }

      painel({
        crit: cauda === 'bi' ? '±' + M.fmt(cDir, 3)
              : (cauda === 'dir' ? '+' + M.fmt(cDir, 3) : M.fmt(cEsq, 3)),
        est: M.fmt(estat, 3),
        p: M.fmt(p, 4),
        dec: rejeita ? '<span style="color:#8c2f39">rejeitar H₀</span>'
                     : '<span style="color:#1f6f54">não rejeitar</span>'
      });

      saida.innerHTML = rejeita
        ? 'A estatística <b>' + M.fmt(estat, 2) + '</b> caiu na <b>região crítica</b>. '
          + 'O valor p = <b>' + M.fmt(p, 4) + '</b> é menor que α = ' + M.fmt(alfa, 2) + ', '
          + 'e as duas vias levam à mesma conclusão: <b>rejeitamos H₀</b> ao nível de '
          + M.pct(alfa, 0) + '. Isso significa que um resultado tão extremo quanto este '
          + 'ocorreria em apenas ' + M.pct(p, 2) + ' das amostras se H₀ fosse verdadeira.'
        : 'A estatística <b>' + M.fmt(estat, 2) + '</b> está na <b>região de não rejeição</b>. '
          + 'O valor p = <b>' + M.fmt(p, 4) + '</b> excede α = ' + M.fmt(alfa, 2) + '. '
          + '<b>Não rejeitamos H₀</b> — o que não é o mesmo que aceitá-la: apenas não há '
          + 'evidência suficiente contra ela nesta amostra.';
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     21. Erros tipo I e II, e o poder do teste
     ================================================================= */
  function poderTeste(raiz) {
    var c = moldura(raiz, 'Erro tipo I, erro tipo II e o poder do teste');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var alfa = 0.05, efeito = 2.5, nAm = 16, sigma = 4;

    var campoA = el('div', { class: 'campo' });
    campoA.appendChild(el('label', { html: 'Nível α' }));
    var selA = el('select');
    [['0.10', '10%'], ['0.05', '5%'], ['0.01', '1%'], ['0.001', '0,1%']].forEach(function (o) {
      selA.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selA.value = '0.05';
    campoA.appendChild(selA); ctr.appendChild(campoA);
    selA.addEventListener('change', function () { alfa = Number(selA.value); atualizar(); });

    deslizante(ctr, 'efeito real μ₁ − μ₀', 0, 8, 0.1, 2.5, function (v) { efeito = v; atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });
    deslizante(ctr, 'tamanho da amostra n', 2, 120, 1, 16, function (v) { nAm = v; atualizar(); });
    deslizante(ctr, 'σ da população', 1, 12, 0.5, 4, function (v) { sigma = v; atualizar(); },
      function (v) { return v.toFixed(1).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Curva azul: distribuição sob H₀ &nbsp;·&nbsp; curva verde: sob H₁ (efeito real) '
      + '&nbsp;·&nbsp; vermelho: erro tipo I (α) &nbsp;·&nbsp; âmbar: erro tipo II (β)' }));
    var painel = cartoes(c, [
      { rot: 'α (erro tipo I)', k: 'a' },
      { rot: 'β (erro tipo II)', k: 'b' },
      { rot: 'poder = 1 − β', k: 'pod' },
      { rot: 'valor crítico', k: 'crit' },
      { rot: 'n para 80% de poder', k: 'n80' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var ep = sigma / Math.sqrt(nAm);
      var zc = M.zCritico(1 - alfa);          /* unilateral à direita */
      var limite = zc * ep;                    /* em unidades da grandeza */
      var beta = M.FNormal(limite, efeito, ep);
      var poder = 1 - beta;

      /* n necessário para poder 80%, unilateral */
      var n80 = efeito > 0
        ? Math.ceil(Math.pow((M.zCritico(1 - alfa) + M.zCritico(0.80)) * sigma / efeito, 2))
        : Infinity;

      painel({
        a: M.pct(alfa, 1), b: M.pct(beta, 1), pod: M.pct(poder, 1),
        crit: M.fmt(limite, 3),
        n80: isFinite(n80) ? String(n80) : '∞'
      });

      var lo = Math.min(-4 * ep, efeito - 4 * ep);
      var hi = Math.max(4 * ep, efeito + 4 * ep);
      var f0 = function (x) { return M.dNormal(x, 0, ep); };
      var f1 = function (x) { return M.dNormal(x, efeito, ep); };
      var g = G.eixos(cv, {
        xmin: lo, xmax: hi, ymax: M.dNormal(0, 0, ep) * 1.22, altura: 300,
        rotX: 'diferença observada  x̄ − μ₀', rotY: 'densidade',
        marcasX: G.marcasLineares(lo, hi, 7, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });

      /* erro tipo II: área de H1 à esquerda do limite */
      G.area(g, f1, lo, limite, 'rgba(181,131,31,.38)');
      /* erro tipo I: área de H0 à direita do limite */
      G.area(g, f0, limite, hi, 'rgba(140,47,57,.42)');

      G.curva(g, f0, G.COR.azul, 2.2);
      G.curva(g, f1, G.COR.verde, 2.2);
      G.vertical(g, limite, G.COR.tinta, 'crítico', false);
      G.legenda(g, [
        { texto: 'H₀ (sem efeito)', cor: G.COR.azul },
        { texto: 'H₁ (efeito real)', cor: G.COR.verde }
      ]);

      saida.innerHTML =
        'Com efeito real de <b>' + M.fmt(efeito, 1) + '</b>, n = <b>' + nAm + '</b> e σ = <b>'
        + M.fmt(sigma, 1) + '</b>, o teste tem poder de <b>' + M.pct(poder, 1) + '</b>: '
        + 'é essa a chance de detectar o efeito, se ele de fato existir. '
        + (poder < 0.8
            ? '<b style="color:#8c2f39">Poder abaixo de 80% — o estudo é subdimensionado.</b> '
              + 'Seriam necessárias <b>' + (isFinite(n80) ? n80 : '∞') + '</b> observações '
              + 'para atingir 80%.'
            : 'Poder adequado (≥ 80%, o mínimo usualmente exigido).')
        + '<br><br>Repare na tensão: reduzir α empurra o valor crítico para a direita e '
        + '<b>encolhe</b> o vermelho — mas <b>aumenta</b> o âmbar. Com n fixo, diminuir um erro '
        + 'aumenta o outro. Só aumentar n reduz os dois ao mesmo tempo, por estreitar as duas curvas.';
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     22. Tabela de contingência e teste qui-quadrado
     ================================================================= */
  var TABELAS = {
    soniferos: {
      rot: 'Soníferos × placebo',
      linhas: ['Sonífero', 'Placebo'],
      colunas: ['Dormiu melhor', 'Não dormiu'],
      dados: [[35, 14], [23, 28]]
    },
    varejo: {
      rot: 'Satisfação × região',
      linhas: ['Muito insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito satisfeito'],
      colunas: ['Sudeste', 'Nordeste', 'Sul', 'Centro-Oeste'],
      dados: [[30, 25, 20, 15], [45, 40, 35, 30], [60, 55, 50, 45],
              [50, 60, 55, 50], [15, 20, 25, 25]]
    },
    ead: {
      rot: 'Aprovação × modalidade',
      linhas: ['Presencial', 'EAD'],
      colunas: ['Aprovado', 'Reprovado'],
      dados: [[78, 22], [66, 34]]
    },
    independente: {
      rot: 'Exemplo sem associação',
      linhas: ['Grupo I', 'Grupo II'],
      colunas: ['Sim', 'Não'],
      dados: [[40, 60], [41, 59]]
    }
  };

  function contingencia(raiz) {
    var c = moldura(raiz, 'Teste qui-quadrado de independência');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'soniferos', alfa = 0.05, yates = true;

    var campoT = el('div', { class: 'campo', style: 'flex:2 1 230px' });
    campoT.appendChild(el('label', { html: 'Conjunto de dados' }));
    var selT = el('select');
    Object.keys(TABELAS).forEach(function (k) {
      selT.appendChild(el('option', { value: k, texto: TABELAS[k].rot }));
    });
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () { chave = selT.value; montar(); });

    var campoA = el('div', { class: 'campo' });
    campoA.appendChild(el('label', { html: 'Nível α' }));
    var selA = el('select');
    [['0.10', '10%'], ['0.05', '5%'], ['0.01', '1%']].forEach(function (o) {
      selA.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selA.value = '0.05';
    campoA.appendChild(selA); ctr.appendChild(campoA);
    selA.addEventListener('change', function () { alfa = Number(selA.value); calcular(); });

    var campoY = el('div', { class: 'campo' });
    campoY.innerHTML = '<label>Tabelas 2×2</label>';
    var labY = el('label', { html: '<input type="checkbox" checked> aplicar correção de Yates',
      style: 'font-weight:400;font-size:.8rem;letter-spacing:0' });
    campoY.appendChild(labY); ctr.appendChild(campoY);
    labY.querySelector('input').addEventListener('change', function (e) {
      yates = e.target.checked; calcular();
    });

    var grade = el('div', { style: 'overflow-x:auto;margin:.4rem 0 .8rem' });
    c.appendChild(grade);
    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'χ² calculado', k: 'chi' }, { rot: 'graus de liberdade', k: 'gl' },
      { rot: 'χ² crítico', k: 'crit' }, { rot: 'valor p', k: 'p' },
      { rot: 'menor esperado', k: 'min' }, { rot: 'decisão', k: 'dec' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    var campos = [];

    function montar() {
      var T = TABELAS[chave];
      grade.innerHTML = '';
      campos = [];
      var tab = el('table', { style: 'font-size:.82rem;min-width:420px' });
      var thead = el('thead');
      var tr = el('tr');
      tr.appendChild(el('th', { texto: '' }));
      T.colunas.forEach(function (nome) { tr.appendChild(el('th', { class: 'num', texto: nome })); });
      tr.appendChild(el('th', { class: 'num', texto: 'total' }));
      thead.appendChild(tr); tab.appendChild(thead);
      var tb = el('tbody');
      T.dados.forEach(function (linha, i) {
        var tr2 = el('tr');
        tr2.appendChild(el('th', { texto: T.linhas[i] }));
        var linhaCampos = [];
        linha.forEach(function (v) {
          var td = el('td');
          var inp = el('input', { type: 'number', value: v, min: 0, step: 1,
            style: 'width:62px;text-align:right;padding:.2rem .3rem;font-size:.82rem' });
          inp.addEventListener('input', calcular);
          td.appendChild(inp); tr2.appendChild(td);
          linhaCampos.push(inp);
        });
        tr2.appendChild(el('td', { class: 'num total-linha', texto: '' }));
        tb.appendChild(tr2);
        campos.push(linhaCampos);
      });
      var trT = el('tr');
      trT.appendChild(el('th', { texto: 'total' }));
      T.colunas.forEach(function () { trT.appendChild(el('th', { class: 'num total-col', texto: '' })); });
      trT.appendChild(el('th', { class: 'num total-geral', texto: '' }));
      tb.appendChild(trT);
      tab.appendChild(tb);
      grade.appendChild(tab);
      calcular();
    }

    function calcular() {
      var obs = campos.map(function (linha) {
        return linha.map(function (inp) { return Math.max(0, Number(inp.value) || 0); });
      });
      var nl = obs.length, nc = obs[0].length;
      var somaL = obs.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
      var somaC = [];
      for (var j = 0; j < nc; j++) {
        var s = 0; for (var i = 0; i < nl; i++) s += obs[i][j];
        somaC.push(s);
      }
      var N = somaL.reduce(function (a, b) { return a + b; }, 0);

      /* preenche os totais na tabela */
      grade.querySelectorAll('.total-linha').forEach(function (td, i) {
        td.textContent = somaL[i];
      });
      grade.querySelectorAll('.total-col').forEach(function (td, j) {
        td.textContent = somaC[j];
      });
      var tg = grade.querySelector('.total-geral');
      if (tg) tg.textContent = N;

      if (N === 0) { saida.innerHTML = 'Preencha a tabela.'; return; }

      var gl = (nl - 1) * (nc - 1);
      var usaYates = yates && nl === 2 && nc === 2;
      var chi = 0, menor = Infinity;
      for (var a = 0; a < nl; a++) {
        for (var b = 0; b < nc; b++) {
          var e = somaL[a] * somaC[b] / N;
          if (e < menor) menor = e;
          if (e > 0) {
            var dif = Math.abs(obs[a][b] - e);
            if (usaYates) dif = Math.max(0, dif - 0.5);
            chi += dif * dif / e;
          }
        }
      }
      var crit = M.quiCritico(alfa, gl);
      var p = 1 - M.FQui(chi, gl);
      var rejeita = chi > crit;

      painel({
        chi: M.fmt(chi, 4), gl: String(gl), crit: M.fmt(crit, 3),
        p: M.fmt(p, 4), min: M.fmt(menor, 2),
        dec: rejeita ? '<span style="color:#8c2f39">há associação</span>'
                     : '<span style="color:#1f6f54">sem evidência</span>'
      });

      desenhar(chi, crit, gl);

      var aviso = menor < 5
        ? '<br><br><b style="color:#8c2f39">Atenção: a menor frequência esperada é '
          + M.fmt(menor, 2) + ', abaixo de 5.</b> A aproximação qui-quadrado fica duvidosa; '
          + 'agrupe categorias ou use o teste exato de Fisher.'
        : '';

      saida.innerHTML =
        'χ² = <b>' + M.fmt(chi, 3) + '</b> com <b>' + gl + '</b> graus de liberdade'
        + (usaYates ? ' <i>(com correção de Yates)</i>' : '') + '. '
        + 'O valor crítico a ' + M.pct(alfa, 0) + ' é <b>' + M.fmt(crit, 3) + '</b> e '
        + 'p = <b>' + M.fmt(p, 4) + '</b>. '
        + (rejeita
            ? '<b>Rejeitamos H₀</b>: há evidência de associação entre as duas variáveis.'
            : '<b>Não rejeitamos H₀</b>: não há evidência de associação — o que não prova '
              + 'independência, apenas não a contradiz.')
        + aviso;
    }

    function desenhar(chi, crit, gl) {
      var xmax = Math.max(crit * 1.6, chi * 1.25, 10);
      var pico = 0;
      for (var x = 0.05; x < xmax; x += xmax / 300) pico = Math.max(pico, M.dQui(x, gl));
      var g = G.eixos(cv, {
        xmin: 0, xmax: xmax, ymax: pico * 1.25, altura: 230,
        rotX: 'χ²', rotY: 'densidade sob H₀',
        marcasX: G.marcasLineares(0, xmax, 6, 0),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var f = function (x) { return M.dQui(x, gl); };
      G.area(g, f, 0, crit, 'rgba(44,95,141,.20)');
      G.area(g, f, crit, xmax, 'rgba(140,47,57,.34)');
      G.curva(g, f, G.COR.tinta, 2);
      G.vertical(g, crit, G.COR.vinho, 'crítico ' + M.fmt(crit, 2), false);

      var ct = g.ct;
      var dentro = chi <= xmax;
      if (dentro) {
        ct.save();
        ct.strokeStyle = chi > crit ? G.COR.vinho : G.COR.verde;
        ct.lineWidth = 3;
        ct.beginPath();
        ct.moveTo(g.X(chi), g.y1); ct.lineTo(g.X(chi), g.y0 + 26); ct.stroke();
        ct.fillStyle = ct.strokeStyle;
        ct.font = '600 11px system-ui, sans-serif';
        ct.textAlign = 'center'; ct.textBaseline = 'bottom';
        ct.fillText('χ² = ' + M.fmt(chi, 2), g.X(chi), g.y0 + 23);
        ct.restore();
      }
      ct.font = '600 10px system-ui, sans-serif';
      ct.fillStyle = '#2c5f8d'; ct.textAlign = 'center'; ct.textBaseline = 'middle';
      ct.fillText('NÃO REJEITAR', g.X(crit / 2), g.y1 - 14);
    }

    montar();
    registrarRedesenho(calcular);
  }

  /* =================================================================
     23. Teste de aderência
     ================================================================= */
  function aderencia(raiz) {
    var c = moldura(raiz, 'Teste de aderência: os dados seguem a distribuição esperada?');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var alfa = 0.05;
    var campoO = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoO.appendChild(el('label', { html: 'Frequências <b>observadas</b> (separadas por vírgula)' }));
    var iO = el('input', { type: 'text', value: '25, 17, 15, 23, 24, 16' });
    campoO.appendChild(iO); ctr.appendChild(campoO);

    var campoE = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoE.appendChild(el('label', { html: 'Frequências <b>esperadas</b> (deixe vazio para distribuição uniforme)' }));
    var iE = el('input', { type: 'text', value: '' });
    campoE.appendChild(iE); ctr.appendChild(campoE);

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoA = el('div', { class: 'campo' });
    campoA.appendChild(el('label', { html: 'Nível α' }));
    var selA = el('select');
    [['0.10', '10%'], ['0.05', '5%'], ['0.01', '1%']].forEach(function (o) {
      selA.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selA.value = '0.05';
    campoA.appendChild(selA); ctr2.appendChild(campoA);
    var iPar = numero(ctr2, 'parâmetros estimados dos dados', 0, atualizar, { min: 0, max: 5, step: 1 });

    var bts = el('div', { class: 'botoes', style: 'margin:.2rem 0 .8rem' }); c.appendChild(bts);
    [['Dado honesto?', '25, 17, 15, 23, 24, 16', ''],
     ['Dado viciado', '12, 14, 13, 15, 16, 50', ''],
     ['Mendel (ervilhas)', '315, 108, 101, 32', '312.75, 104.25, 104.25, 34.75']
    ].forEach(function (ex) {
      botao(bts, ex[0], function () { iO.value = ex[1]; iE.value = ex[2]; atualizar(); }, true);
    });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Barras azuis: observado &nbsp;·&nbsp; contorno vermelho: esperado sob H₀' }));
    var tab = el('div', { class: 'tabela-rolavel' }); c.appendChild(tab);
    var painel = cartoes(c, [
      { rot: 'χ² calculado', k: 'chi' }, { rot: 'graus de liberdade', k: 'gl' },
      { rot: 'χ² crítico', k: 'crit' }, { rot: 'valor p', k: 'p' },
      { rot: 'decisão', k: 'dec' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    iO.addEventListener('input', atualizar);
    iE.addEventListener('input', atualizar);
    selA.addEventListener('change', function () { alfa = Number(selA.value); atualizar(); });

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return !isNaN(v); });
    }

    function atualizar() {
      var obs = ler(iO.value);
      if (obs.length < 2) {
        saida.innerHTML = 'Informe pelo menos duas categorias.';
        tab.innerHTML = ''; G.preparar(cv, 240);
        return;
      }
      var N = obs.reduce(function (a, b) { return a + b; }, 0);
      var esp = ler(iE.value);
      if (esp.length !== obs.length) {
        esp = obs.map(function () { return N / obs.length; });
      }
      var par = Math.max(0, Math.floor(Number(iPar.value) || 0));
      var gl = Math.max(1, obs.length - 1 - par);

      var chi = 0, menor = Infinity, linhas = '';
      for (var i = 0; i < obs.length; i++) {
        var e = esp[i];
        if (e < menor) menor = e;
        var parc = e > 0 ? Math.pow(obs[i] - e, 2) / e : 0;
        chi += parc;
        linhas += '<tr><td class="num">' + (i + 1) + '</td>'
                + '<td class="num">' + M.fmt(obs[i], 0) + '</td>'
                + '<td class="num">' + M.fmt(e, 2) + '</td>'
                + '<td class="num">' + M.fmt(obs[i] - e, 2) + '</td>'
                + '<td class="num">' + M.fmt(parc, 4) + '</td></tr>';
      }
      tab.innerHTML = '<table><thead><tr><th class="num">categoria</th>'
        + '<th class="num">O<sub>i</sub></th><th class="num">E<sub>i</sub></th>'
        + '<th class="num">O−E</th><th class="num">(O−E)²/E</th></tr></thead><tbody>'
        + linhas + '<tr><th class="num">Σ</th><th class="num">' + M.fmt(N, 0) + '</th>'
        + '<th class="num">' + M.fmt(esp.reduce(function (a, b) { return a + b; }, 0), 1) + '</th>'
        + '<th class="num">0</th><th class="num">' + M.fmt(chi, 4) + '</th></tr></tbody></table>';

      var crit = M.quiCritico(alfa, gl);
      var p = 1 - M.FQui(chi, gl);
      var rejeita = chi > crit;
      painel({
        chi: M.fmt(chi, 4), gl: String(gl), crit: M.fmt(crit, 3), p: M.fmt(p, 4),
        dec: rejeita ? '<span style="color:#8c2f39">não adere</span>'
                     : '<span style="color:#1f6f54">adere</span>'
      });

      desenhar(obs, esp);

      saida.innerHTML = 'χ² = <b>' + M.fmt(chi, 3) + '</b> com <b>' + gl + '</b> gl '
        + '(= ' + obs.length + ' categorias − 1' + (par ? ' − ' + par + ' parâmetro(s)' : '') + '). '
        + 'Crítico: <b>' + M.fmt(crit, 3) + '</b>, p = <b>' + M.fmt(p, 4) + '</b>. '
        + (rejeita
            ? '<b>Rejeitamos H₀</b>: os dados <b>não</b> seguem a distribuição proposta.'
            : '<b>Não rejeitamos H₀</b>: os dados são compatíveis com a distribuição proposta.')
        + (menor < 5
            ? '<br><br><b style="color:#8c2f39">Alguma frequência esperada é menor que 5</b> — '
              + 'agrupe categorias antes de confiar no resultado.'
            : '');
    }

    function desenhar(obs, esp) {
      var k = obs.length;
      var ymax = Math.max(Math.max.apply(null, obs), Math.max.apply(null, esp)) * 1.2;
      var g = G.eixos(cv, {
        xmin: 0.3, xmax: k + 0.7, ymax: ymax, altura: 240,
        rotX: 'categoria', rotY: 'frequência',
        marcasX: G.marcasInteiras(1, k, 12),
        formataY: function (v) { return String(Math.round(v)); }
      });
      G.barras(g, obs.map(function (v, i) { return { x: i + 1, y: v }; }), G.COR.azulClaro, 0.6);
      var ct = g.ct;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.2;
      var passo = (g.x1 - g.x0) / (g.xmax - g.xmin);
      var w = passo * 0.6;
      esp.forEach(function (v, i) {
        var x = g.X(i + 1), y = g.Y(v);
        ct.beginPath(); ct.moveTo(x - w / 2, y); ct.lineTo(x + w / 2, y); ct.stroke();
      });
    }

    atualizar();
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     24. Gráfico Q–Q e testes de normalidade
     ================================================================= */
  var CONJUNTOS_QQ = {
    reacao: { rot: 'Tempo de reação (normal)', dados:
      '215.4 198.7 220.3 205.8 232.1 198.2 225.6 212.4 228.9 203.5 228.1 235.6 ' +
      '210.9 218.3 225.0 240.3 205.1 230.8 215.2 222.5 221.8 230.2 225.4 208.6 ' +
      '215.9 222.7 218.4 235.1 210.3 225.7' },
    renda: { rot: 'Renda (assimétrica à direita)', dados:
      '1.0 1.1 1.2 1.3 1.4 1.5 1.5 1.6 1.8 1.9 2.0 2.1 2.3 2.5 2.6 2.8 3.0 3.2 ' +
      '3.5 3.8 4.2 4.6 5.1 5.8 6.5 7.4 8.6 10.2 12.8 18.5 27.0' },
    bimodal: { rot: 'Bimodal (dois grupos)', dados:
      '32 33 34 34 35 35 36 36 37 37 38 38 39 40 41 ' +
      '62 63 64 64 65 65 66 66 67 67 68 68 69 70 71' },
    pesada: { rot: 'Caudas pesadas', dados:
      '-18.2 -7.4 -4.1 -2.8 -2.0 -1.5 -1.1 -0.8 -0.5 -0.3 -0.1 0.0 0.1 0.3 0.5 ' +
      '0.8 1.1 1.5 2.0 2.8 4.1 7.4 18.2 -0.2 0.2 -0.6 0.6 -1.3 1.3 -3.2' },
    uniforme: { rot: 'Uniforme (caudas leves)', dados:
      '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30' },
    royston: { rot: 'Pesos (Royston, n=11)', dados:
      '148 154 158 160 161 162 166 170 182 195 236' }
  };

  function qqplot(raiz) {
    var c = moldura(raiz, 'Gráfico Q–Q e testes numéricos de normalidade');

    var campoT = el('div', { class: 'campo', style: 'flex-basis:100%;min-width:100%' });
    campoT.appendChild(el('label', { html: 'Dados (separados por espaço, vírgula ou linha)' }));
    var ta = el('textarea', { rows: '3', style:
      'width:100%;font-family:var(--mono);font-size:.8rem;padding:.45rem .55rem;' +
      'border:1px solid var(--borda);border-radius:6px;resize:vertical' });
    campoT.appendChild(ta); c.appendChild(campoT);

    var bts = el('div', { class: 'botoes', style: 'margin:.5rem 0 .9rem' });
    c.appendChild(bts);
    Object.keys(CONJUNTOS_QQ).forEach(function (k) {
      botao(bts, CONJUNTOS_QQ[k].rot.split(' (')[0], function () {
        ta.value = CONJUNTOS_QQ[k].dados; atualizar();
      }, true);
    });

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Quantis teóricos da normal no eixo horizontal, quantis observados no vertical '
      + '&nbsp;·&nbsp; se os dados forem normais, os pontos caem sobre a reta' }));
    var cv2 = el('canvas'); c.appendChild(cv2);
    c.appendChild(el('div', { class: 'legenda', html:
      'Histograma dos mesmos dados, com a normal de igual média e desvio sobreposta' }));

    var tab = el('div', { class: 'tabela-rolavel' }); c.appendChild(tab);
    var painel = cartoes(c, [
      { rot: 'n', k: 'n' }, { rot: 'assimetria g₁', k: 'g1' },
      { rot: 'curtose g₂', k: 'g2' }, { rot: 'veredito', k: 'ver' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler() {
      return String(ta.value).split(/[\s,;]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function atualizar() {
      var d = ler();
      if (d.length < 4) {
        saida.innerHTML = 'Informe pelo menos quatro valores, ou escolha um conjunto acima.';
        painel({ n: String(d.length), g1: '—', g2: '—', ver: '—' });
        tab.innerHTML = ''; G.preparar(cv, 280); G.preparar(cv2, 220);
        return;
      }
      var ord = d.slice().sort(function (a, b) { return a - b; });
      var n = ord.length, mo = M.momentos(ord);

      /* quantis teóricos pela fórmula de Blom */
      var pontos = ord.map(function (v, i) {
        return { t: M.zCritico((i + 1 - 0.375) / (n + 0.25)), o: v };
      });

      var sw = M.shapiroWilk(ord), da = M.dagostino(ord),
          ad = M.andersonDarling(ord), li = M.lilliefors(ord);

      var linhas = '';
      function linha(nome, est, p, extra) {
        var veredito = p === null
          ? (extra ? extra : '—')
          : (p < 0.05 ? '<b style="color:#8c2f39">rejeita normalidade</b>'
                      : '<b style="color:#1f6f54">não rejeita</b>');
        linhas += '<tr><td>' + nome + '</td><td class="num">' + est + '</td>'
                + '<td class="num">' + (p === null ? '—' : M.fmt(p, 4)) + '</td>'
                + '<td>' + veredito + '</td></tr>';
      }
      if (sw) linha('Shapiro–Wilk', 'W = ' + M.fmt(sw.W, 4), sw.p);
      else linha('Shapiro–Wilk', '—', null, 'exige 4 ≤ n ≤ 5000');
      if (da) linha("D'Agostino K²", 'K² = ' + M.fmt(da.K2, 4), da.p);
      else linha("D'Agostino K²", '—', null, 'exige n ≥ 8');
      if (ad) linha('Anderson–Darling', 'A² = ' + M.fmt(ad.A2, 4), ad.p);
      else linha('Anderson–Darling', '—', null, 'exige n ≥ 8');
      if (li) {
        linhas += '<tr><td>Kolmogorov–Smirnov<br><small>(Lilliefors)</small></td>'
                + '<td class="num">D = ' + M.fmt(li.D, 4) + '</td>'
                + '<td class="num">crít. 5%: ' + M.fmt(li.crit05, 4) + '</td><td>'
                + (li.rejeita ? '<b style="color:#8c2f39">rejeita normalidade</b>'
                              : '<b style="color:#1f6f54">não rejeita</b>') + '</td></tr>';
      }
      tab.innerHTML = '<table><thead><tr><th>Teste</th><th class="num">Estatística</th>'
        + '<th class="num">valor p</th><th>Veredito a 5%</th></tr></thead><tbody>'
        + linhas + '</tbody></table>';

      var rejeitam = [sw, da, ad].filter(function (r) { return r && r.p < 0.05; }).length
                   + (li && li.rejeita ? 1 : 0);

      painel({
        n: String(n), g1: M.fmt(mo.g1, 3), g2: M.fmt(mo.g2, 3),
        ver: rejeitam === 0 ? '<span style="color:#1f6f54">compatível</span>'
             : (rejeitam >= 3 ? '<span style="color:#8c2f39">não normal</span>'
                              : '<span style="color:#b5831f">duvidoso</span>')
      });

      desenharQQ(pontos, mo);
      desenharHist(ord, mo);

      var diag = '';
      if (Math.abs(mo.g1) > 0.6) {
        diag = 'A assimetria g₁ = <b>' + M.fmt(mo.g1, 2) + '</b> indica cauda longa '
             + (mo.g1 > 0 ? 'à <b>direita</b>' : 'à <b>esquerda</b>')
             + ', e no Q–Q isso aparece como curvatura em <b>C</b>. '
             + (mo.g1 > 0 ? 'Transformar com log ou raiz costuma resolver. ' : '');
      } else if (mo.g2 > 1) {
        diag = 'A curtose g₂ = <b>' + M.fmt(mo.g2, 2) + '</b> indica <b>caudas pesadas</b> '
             + '(leptocúrtica), e no Q–Q os extremos escapam da reta nas duas pontas. ';
      } else if (mo.g2 < -1) {
        diag = 'A curtose g₂ = <b>' + M.fmt(mo.g2, 2) + '</b> indica <b>caudas leves</b> '
             + '(platicúrtica) — típico de dados uniformes ou truncados. ';
      }

      saida.innerHTML = diag
        + (rejeitam === 0
            ? 'Nenhum dos testes rejeita a normalidade ao nível de 5%. Os dados são '
              + '<b>compatíveis</b> com uma população normal — o que não prova que o sejam.'
            : rejeitam >= 3
              ? '<b>' + rejeitam + ' dos 4 testes rejeitam</b> a normalidade. '
                + 'Considere transformar os dados ou usar métodos não paramétricos (Módulo 14).'
              : 'Os testes <b>divergem</b>: ' + rejeitam + ' de 4 rejeitam. '
                + 'É o caso em que o gráfico Q–Q decide — olhe o tamanho do desvio, não só o veredito.')
        + (n < 20
            ? '<br><br><b>Atenção:</b> com n = ' + n + ', os testes têm pouco poder. '
              + 'Não rejeitar aqui significa muito pouco.'
            : '');
    }

    function desenharQQ(pontos, mo) {
      var tmin = pontos[0].t, tmax = pontos[pontos.length - 1].t;
      var omin = pontos[0].o, omax = pontos[pontos.length - 1].o;
      var folgaT = (tmax - tmin) * 0.1, folgaO = (omax - omin) * 0.1;
      var g = G.eixos(cv, {
        xmin: tmin - folgaT, xmax: tmax + folgaT,
        ymin: omin - folgaO, ymax: omax + folgaO, altura: 290,
        rotX: 'quantis teóricos da normal (z)', rotY: 'quantis observados',
        marcasX: G.marcasLineares(tmin - folgaT, tmax + folgaT, 6, 1),
        formataY: function (v) { return M.fmt(v, Math.abs(omax - omin) > 50 ? 0 : 1); }
      });
      var ct = g.ct;
      /* reta de referência: passa por (0, média) com inclinação s */
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2;
      ct.beginPath();
      ct.moveTo(g.X(g.xmin), g.Y(mo.media + mo.s * g.xmin));
      ct.lineTo(g.X(g.xmax), g.Y(mo.media + mo.s * g.xmax));
      ct.stroke();
      /* banda indicativa */
      ct.strokeStyle = 'rgba(140,47,57,.25)'; ct.lineWidth = 1; ct.setLineDash([4, 4]);
      [-1, 1].forEach(function (s) {
        ct.beginPath();
        ct.moveTo(g.X(g.xmin), g.Y(mo.media + mo.s * (g.xmin + s * 0.35)));
        ct.lineTo(g.X(g.xmax), g.Y(mo.media + mo.s * (g.xmax + s * 0.35)));
        ct.stroke();
      });
      ct.setLineDash([]);
      /* pontos */
      pontos.forEach(function (p) {
        var esperado = mo.media + mo.s * p.t;
        var longe = Math.abs(p.o - esperado) > 0.35 * mo.s;
        ct.fillStyle = longe ? G.COR.vinho : G.COR.azul;
        ct.beginPath(); ct.arc(g.X(p.t), g.Y(p.o), 3.1, 0, 2 * Math.PI); ct.fill();
      });
    }

    function desenharHist(ord, mo) {
      var n = ord.length, min = ord[0], max = ord[n - 1];
      var k = Math.max(4, Math.min(14, Math.ceil(1 + 3.322 * Math.log10(n))));
      var larg = (max - min) / k || 1;
      var cont = new Array(k).fill(0);
      ord.forEach(function (x) {
        cont[Math.min(k - 1, Math.floor((x - min) / larg))]++;
      });
      var dens = cont.map(function (q) { return q / (n * larg); });
      var pico = Math.max(M.dNormal(mo.media, mo.media, mo.s), Math.max.apply(null, dens));
      var lo = Math.min(min, mo.media - 3.5 * mo.s), hi = Math.max(max, mo.media + 3.5 * mo.s);
      var g = G.eixos(cv2, {
        xmin: lo, xmax: hi, ymax: pico * 1.2, altura: 220,
        rotX: 'valor', rotY: 'densidade',
        marcasX: G.marcasLineares(lo, hi, 6, Math.abs(hi - lo) > 50 ? 0 : 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });
      var ct = g.ct;
      ct.fillStyle = G.COR.azulClaro;
      dens.forEach(function (dv, i) {
        if (dv <= 0) return;
        var x0 = g.X(min + i * larg), x1 = g.X(min + (i + 1) * larg), y = g.Y(dv);
        ct.fillRect(x0 + 0.5, y, Math.max(1, x1 - x0 - 1), g.y1 - y);
      });
      G.curva(g, function (x) { return M.dNormal(x, mo.media, mo.s); }, G.COR.vinho, 2.2);
    }

    ta.addEventListener('input', atualizar);
    ta.value = CONJUNTOS_QQ.reacao.dados;
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
    pascal: pascal, aniversarios: aniversarios, montyhall: montyhall,
    galton: galton, intervalos: intervalos, calcic: calcIC,
    regiaocritica: regiaoCritica, poder: poderTeste,
    contingencia: contingencia, aderencia: aderencia, qqplot: qqplot
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
