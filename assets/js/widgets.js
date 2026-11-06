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
     Registro e inicialização
     ================================================================= */
  var REGISTRO = {
    dados2: dadosDois, eventos: eventos, encontro: encontro, contagem: contagem,
    bayes: bayes, discreta: discreta, binomial: binomial, poisson: poisson,
    normal: normal, tcl: tcl, passeio: passeio, moeda: moeda, exponencial: exponencial
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
