/* ===================================================================
   widgets.js: simuladores e calculadoras interativas
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
        '<span class="rot">' + c.rot + '</span><span class="val" data-k="' + c.k + '">: </span>' }));
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
     3. Probabilidade geométrica: problema do encontro
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
          + fmtInt(M.binom(n, k)) + ' <b>subconjuntos</b>: cada subconjunto foi contado '
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
          + 'n ≤ 8 e há no máximo 70 combinações: reduza n ou k para vê-la.</span>';
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
      texto: 'Contagens (frequências): normalizo para você' }));
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
        saida.innerHTML = 'A soma da segunda linha é zero: não há o que normalizar.';
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
            + '<b>por construção</b>: a normalização é automática. ';
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
               : '<b>A média não é um dos valores possíveis</b>: como nos 2,4 filhos por família.');
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
        + M.fmt(za, 2) + '</b> a <b>' + M.fmt(zb, 2) + '</b>, e essa probabilidade '
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

      saida.innerHTML = 'Após <b>' + nPassos + '</b> passos, a posição média é <b>zero</b>: '
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
          + 'Desvio: <b>' + M.pct(Math.abs(caras / n - p), 3) + '</b>: tende a cair como \\(1/\\sqrt{n}\\).';
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
        + '</b> é maior que a <b>meia-vida</b> = <b>' + M.fmt(mv, 3) + '</b>: a cauda longa puxa a média. '
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
    assimetrica: { rot: 'Renda mensal (salários mínimos): assimétrica', dados:
      '1 1 1.2 1.3 1.5 1.5 1.8 2 2 2.1 2.3 2.5 2.5 3 3.2 3.5 4 4.5 5 6 7 9 12 18 30' },
    outliers: { rot: 'Tempos de reação (ms): com outliers', dados:
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
      botao(ctrPre, CONJUNTOS[k].rot.split(': ')[0].split(' (')[0], function () {
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
            + '. Note quanto eles deslocam a média sem mexer na mediana: apague-os do campo de texto e compare.'
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
          + 'desvios à direita, ou seja, uma variável <b>binomial</b>. Solte algumas bolas.'
        : '<b>' + total.toLocaleString('pt-BR') + '</b> bolas. Média observada <b>'
          + M.fmt(mo, 3) + '</b> (teoria: np = ' + M.fmt(mt, 2) + '); dispersão <b>'
          + M.fmt(so, 3) + '</b> (teoria: √(np(1−p)) = ' + M.fmt(st, 3) + '). '
          + 'Nenhuma bola "sabe" da binomial: ela emerge de ' + fileiras
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
            + 'por acidente são descartadas, e só restam as que <em>se parecem</em> com o jogo clássico.';
        return;
      }
      saida.innerHTML = 'Em <b>' + n.toLocaleString('pt-BR') + '</b> partidas: trocar venceu '
        + '<b>' + M.pct(trocou / n, 1) + '</b> das vezes e manter, <b>'
        + M.pct(manteve / n, 1) + '</b>. '
        + (modo === 'informado'
            ? 'Os valores convergem para <b>2/3</b> e <b>1/3</b>: trocar <b>dobra</b> a chance.'
            : 'Agora as duas estratégias empatam em <b>1/2</b>. O evento observado é o mesmo: '
              + 'uma porta aberta com cabra, mas foi <b>gerado por outro mecanismo</b>, e por '
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
            ? 'As duas células acima dela (em laranja) somam exatamente esse valor: '
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
            ? 'Já passamos de 50%, e bastaram <b>' + n50 + '</b> pessoas para isso.'
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
          + 'Repare que <b>cada célula vale 1/36</b>: são elas as equiprováveis, '
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
        ? 'Os dois gráficos estão na <b>mesma escala de valores?</b> Não: repare nos eixos. '
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
        + M.fmt(tc, 3) + '</b> contra <b>' + M.fmt(zc, 3) + '</b> da normal: um intervalo <b>'
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
            ? 'Para k grande ela vai ficando simétrica: é o TCL agindo, já que χ² é uma soma de k parcelas independentes.'
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
    selT.appendChild(el('option', { value: 't', texto: 'Não: usar s e a t de Student' }));
    selT.appendChild(el('option', { value: 'z', texto: 'Sim: usar σ e a normal' }));
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
        + '<b>' + M.pct(acum.ok / acum.n, 2) + '</b>, e deve convergir para '
        + M.pct(conf, 0) + '. '
        + '<br><br><b>É isto que significa 95% de confiança:</b> o <i>procedimento</i> acerta em '
        + '95% das amostras. Um intervalo específico ou contém μ ou não contém: não há '
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
                    : '<b style="color:#8c2f39">Atenção: np̂ ou n(1−p̂) é menor que 5: '
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
          + 'Note que o intervalo <b>não é simétrico</b> em torno de s²: a qui-quadrado é '
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
          + '<b>Não rejeitamos H₀</b>: o que não é o mesmo que aceitá-la: apenas não há '
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
            ? '<b style="color:#8c2f39">Poder abaixo de 80%: o estudo é subdimensionado.</b> '
              + 'Seriam necessárias <b>' + (isFinite(n80) ? n80 : '∞') + '</b> observações '
              + 'para atingir 80%.'
            : 'Poder adequado (≥ 80%, o mínimo usualmente exigido).')
        + '<br><br>Repare na tensão: reduzir α empurra o valor crítico para a direita e '
        + '<b>encolhe</b> o vermelho, mas <b>aumenta</b> o âmbar. Com n fixo, diminuir um erro '
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
            : '<b>Não rejeitamos H₀</b>: não há evidência de associação: o que não prova '
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
            ? '<br><br><b style="color:#8c2f39">Alguma frequência esperada é menor que 5</b>: '
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

    var transf = 'nenhuma';
    var TRANSF = {
      nenhuma: { rot: 'Nenhuma (dados originais)', f: function (v) { return v; },
                 exige: function () { return true; }, nome: 'x' },
      ln:   { rot: 'Logaritmo natural: ln x', f: Math.log,
              exige: function (v) { return v > 0; }, nome: 'ln x' },
      log10:{ rot: 'Logaritmo decimal: log₁₀ x', f: Math.log10,
              exige: function (v) { return v > 0; }, nome: 'log₁₀ x' },
      raiz: { rot: 'Raiz quadrada: √x', f: Math.sqrt,
              exige: function (v) { return v >= 0; }, nome: '√x' },
      inv:  { rot: 'Inversa: 1/x', f: function (v) { return 1 / v; },
              exige: function (v) { return v !== 0; }, nome: '1/x' },
      quad: { rot: 'Quadrado: x²', f: function (v) { return v * v; },
              exige: function () { return true; }, nome: 'x²' }
    };
    var ctrT = el('div', { class: 'controles' }); c.appendChild(ctrT);
    var campoTr = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoTr.appendChild(el('label', { html: 'Transformação a aplicar' }));
    var selTr = el('select');
    Object.keys(TRANSF).forEach(function (k) {
      selTr.appendChild(el('option', { value: k, texto: TRANSF[k].rot }));
    });
    campoTr.appendChild(selTr); ctrT.appendChild(campoTr);
    selTr.addEventListener('change', function () { transf = selTr.value; atualizar(); });

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

    function lerCru() {
      return String(ta.value).split(/[\s,;]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    var aviso = '';
    function ler() {
      var cru = lerCru(), T = TRANSF[transf];
      aviso = '';
      if (transf === 'nenhuma') return cru;
      var validos = cru.filter(T.exige);
      if (validos.length < cru.length) {
        aviso = (cru.length - validos.length) + ' valor(es) foram descartados por não '
              + 'admitirem esta transformação.';
      }
      var fora = validos.map(T.f).filter(function (v) { return isFinite(v); });
      return fora;
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
             + '(platicúrtica): típico de dados uniformes ou truncados. ';
      }

      var cab = '';
      if (transf !== 'nenhuma') {
        cab = 'Analisando <b>' + TRANSF[transf].nome + '</b> em vez de x. '
            + (aviso ? '<i>' + aviso + '</i> ' : '');
      }

      saida.innerHTML = cab + diag
        + (rejeitam === 0
            ? 'Nenhum dos testes rejeita a normalidade ao nível de 5%. Os dados são '
              + '<b>compatíveis</b> com uma população normal: o que não prova que o sejam.'
            : rejeitam >= 3
              ? '<b>' + rejeitam + ' dos 4 testes rejeitam</b> a normalidade. '
                + 'Considere transformar os dados ou usar métodos não paramétricos (Módulo 14).'
              : 'Os testes <b>divergem</b>: ' + rejeitam + ' de 4 rejeitam. '
                + 'É o caso em que o gráfico Q–Q decide: olhe o tamanho do desvio, não só o veredito.')
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
        rotX: 'quantis teóricos da normal (z)',
        rotY: 'quantis observados de ' + TRANSF[transf].nome,
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
        rotX: TRANSF[transf].nome, rotY: 'densidade',
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
     25. Correlação: Pearson, Spearman e o quarteto de Anscombe
     ================================================================= */
  var PARES = {
    altura: { rot: 'Altura × peso',
      rx: 'altura (cm)', ry: 'peso (kg)',
      x: [165, 170, 175, 168, 172, 180, 160, 175, 165, 170],
      y: [60, 65, 70, 68, 72, 80, 55, 75, 62, 68] },
    estudo: { rot: 'Horas de estudo × nota',
      rx: 'horas de estudo', ry: 'nota',
      x: [2, 4, 6, 8, 10, 12, 14, 16],
      y: [65, 70, 75, 85, 80, 90, 95, 60] },
    monotona: { rot: 'Relação monótona não linear',
      rx: 'x', ry: 'y = x³',
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [1, 8, 27, 64, 125, 216, 343, 512, 729, 1000] },
    a1: { rot: 'Anscombe I', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68] },
    a2: { rot: 'Anscombe II', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74] },
    a3: { rot: 'Anscombe III', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73] },
    a4: { rot: 'Anscombe IV', rx: 'x', ry: 'y',
      x: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8],
      y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89] }
  };

  /* postos com média em caso de empate */
  function postos(v) {
    var idx = v.map(function (val, i) { return { val: val, i: i }; })
               .sort(function (a, b) { return a.val - b.val; });
    var r = new Array(v.length), i = 0;
    while (i < idx.length) {
      var j = i;
      while (j + 1 < idx.length && idx[j + 1].val === idx[i].val) j++;
      var media = (i + j + 2) / 2;
      for (var k = i; k <= j; k++) r[idx[k].i] = media;
      i = j + 1;
    }
    return r;
  }

  function pearson(x, y) {
    var n = x.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0, syy = 0;
    for (i = 0; i < n; i++) {
      sxy += (x[i] - mx) * (y[i] - my);
      sxx += (x[i] - mx) * (x[i] - mx);
      syy += (y[i] - my) * (y[i] - my);
    }
    var r = (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : NaN;
    return { r: r, mx: mx, my: my, sxy: sxy, sxx: sxx, syy: syy,
             a: sxx > 0 ? sxy / sxx : NaN,
             b: sxx > 0 ? my - (sxy / sxx) * mx : NaN };
  }

  function correlacao(raiz) {
    var c = moldura(raiz, 'Correlação de Pearson e de Spearman');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'altura';
    var campoD = el('div', { class: 'campo', style: 'flex:2 1 240px' });
    campoD.appendChild(el('label', { html: 'Conjunto de dados' }));
    var selD = el('select');
    Object.keys(PARES).forEach(function (k) {
      selD.appendChild(el('option', { value: k, texto: PARES[k].rot }));
    });
    campoD.appendChild(selD); ctr.appendChild(campoD);
    selD.addEventListener('change', function () {
      chave = selD.value;
      iX.value = PARES[chave].x.join(', ');
      iY.value = PARES[chave].y.join(', ');
      atualizar();
    });

    var mostrarReta = true;
    var campoR = el('div', { class: 'campo' });
    campoR.innerHTML = '<label>Gráfico</label>';
    var labR = el('label', { html: '<input type="checkbox" checked> mostrar reta de ajuste',
      style: 'font-weight:400;font-size:.8rem;letter-spacing:0' });
    campoR.appendChild(labR); ctr.appendChild(campoR);
    labR.querySelector('input').addEventListener('change', function (e) {
      mostrarReta = e.target.checked; atualizar();
    });

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoX = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoX.appendChild(el('label', { html: 'valores de x' }));
    var iX = el('input', { type: 'text' }); campoX.appendChild(iX); ctr2.appendChild(campoX);
    var campoY = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoY.appendChild(el('label', { html: 'valores de y' }));
    var iY = el('input', { type: 'text' }); campoY.appendChild(iY); ctr2.appendChild(campoY);
    iX.addEventListener('input', atualizar);
    iY.addEventListener('input', atualizar);

    var cv = el('canvas'); c.appendChild(cv);
    var painel = cartoes(c, [
      { rot: 'r de Pearson', k: 'r' }, { rot: 'r² (determinação)', k: 'r2' },
      { rot: 'ρ de Spearman', k: 'rho' }, { rot: 't de Pearson', k: 't' },
      { rot: 'valor p (Pearson)', k: 'p' }, { rot: 'n', k: 'n' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function classifica(v) {
      var a = Math.abs(v);
      if (a >= 0.9) return 'muito forte';
      if (a >= 0.7) return 'forte';
      if (a >= 0.5) return 'moderada';
      if (a >= 0.3) return 'fraca';
      return 'desprezível';
    }

    function atualizar() {
      var x = ler(iX.value), y = ler(iY.value);
      var n = Math.min(x.length, y.length);
      if (n < 3) {
        saida.innerHTML = 'Informe ao menos três pares (x, y).';
        painel({ r: '—', r2: '—', rho: '—', t: '—', p: '—', n: String(n) });
        G.preparar(cv, 300);
        return;
      }
      x = x.slice(0, n); y = y.slice(0, n);

      var P = pearson(x, y);
      var rx = postos(x), ry = postos(y);
      var S = pearson(rx, ry);           /* Spearman = Pearson dos postos */
      var rho = S.r;

      var temEmpate = new Set(x).size < n || new Set(y).size < n;
      var sd2 = 0;
      for (var i = 0; i < n; i++) sd2 += Math.pow(rx[i] - ry[i], 2);
      var rhoSimples = 1 - 6 * sd2 / (n * (n * n - 1));

      var t = isFinite(P.r) && Math.abs(P.r) < 1
            ? P.r * Math.sqrt((n - 2) / (1 - P.r * P.r)) : Infinity;
      var p = isFinite(t) ? 2 * (1 - M.FT(Math.abs(t), n - 2)) : 0;

      painel({
        r: M.fmt(P.r, 4), r2: M.fmt(P.r * P.r, 4), rho: M.fmt(rho, 4),
        t: isFinite(t) ? M.fmt(t, 3) : '∞',
        p: M.fmt(p, 5), n: String(n)
      });

      desenhar(x, y, P);

      var txt = 'r = <b>' + M.fmt(P.r, 3) + '</b> indica correlação <b>' + classifica(P.r)
        + '</b> e ' + (P.r > 0 ? 'positiva' : 'negativa') + '. '
        + 'O coeficiente de determinação r² = <b>' + M.pct(P.r * P.r, 1) + '</b> é a fração da '
        + 'variação de y explicada pela relação linear com x. ';

      if (Math.abs(rho - P.r) > 0.12) {
        txt += '<br><br><b>Pearson e Spearman divergem bastante</b> (r = ' + M.fmt(P.r, 3)
             + ' contra ρ = ' + M.fmt(rho, 3) + '). Isso acontece quando a relação é '
             + '<b>monótona mas não linear</b>, ou quando há outliers que deslocam o r. '
             + 'Olhe o gráfico antes de escolher qual reportar.';
      }
      if (temEmpate) {
        txt += '<br><br>Há <b>empates</b> nos dados. Os postos empatados recebem a '
             + '<b>média</b> das posições, e nesse caso a fórmula simplificada '
             + '1 − 6Σd²/[n(n²−1)] = ' + M.fmt(rhoSimples, 4) + ' deixa de ser exata: '
             + 'o valor correto, ' + M.fmt(rho, 4) + ', vem de aplicar Pearson aos postos.';
      }
      txt += '<br><br>Teste de significância: t = <b>' + (isFinite(t) ? M.fmt(t, 3) : '∞')
           + '</b> com ' + (n - 2) + ' graus de liberdade, crítico '
           + M.fmt(M.tCritico(0.025, n - 2), 3) + ' a 5%. '
           + (p < 0.05
               ? '<b>A correlação é significativa</b> (p = ' + M.fmt(p, 4) + ').'
               : '<b>Não há evidência de correlação</b> na população (p = ' + M.fmt(p, 4) + ').');

      saida.innerHTML = txt;
    }

    function desenhar(x, y, P) {
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var ymin = Math.min.apply(null, y), ymax = Math.max.apply(null, y);
      var fx = (xmax - xmin) * 0.1 || 1, fy = (ymax - ymin) * 0.12 || 1;
      var g = G.eixos(cv, {
        xmin: xmin - fx, xmax: xmax + fx, ymin: ymin - fy, ymax: ymax + fy,
        altura: 300,
        rotX: PARES[chave] ? PARES[chave].rx : 'x',
        rotY: PARES[chave] ? PARES[chave].ry : 'y',
        marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, (xmax - xmin) > 20 ? 0 : 1),
        formataY: function (v) { return M.fmt(v, (ymax - ymin) > 20 ? 0 : 1); }
      });
      var ct = g.ct;
      if (mostrarReta && isFinite(P.a)) {
        ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2;
        ct.beginPath();
        ct.moveTo(g.X(g.xmin), g.Y(P.a * g.xmin + P.b));
        ct.lineTo(g.X(g.xmax), g.Y(P.a * g.xmax + P.b));
        ct.stroke();
        /* resíduos */
        ct.strokeStyle = 'rgba(181,131,31,.55)'; ct.lineWidth = 1;
        ct.setLineDash([3, 3]);
        for (var i = 0; i < x.length; i++) {
          ct.beginPath();
          ct.moveTo(g.X(x[i]), g.Y(y[i]));
          ct.lineTo(g.X(x[i]), g.Y(P.a * x[i] + P.b));
          ct.stroke();
        }
        ct.setLineDash([]);
      }
      /* médias */
      G.vertical(g, P.mx, '#c9d2db', '');
      ct.strokeStyle = '#c9d2db'; ct.lineWidth = 1; ct.setLineDash([4, 4]);
      ct.beginPath(); ct.moveTo(g.x0, g.Y(P.my)); ct.lineTo(g.x1, g.Y(P.my)); ct.stroke();
      ct.setLineDash([]);
      /* pontos */
      ct.fillStyle = G.COR.azul;
      for (var j = 0; j < x.length; j++) {
        ct.beginPath(); ct.arc(g.X(x[j]), g.Y(y[j]), 4, 0, 2 * Math.PI); ct.fill();
      }
      if (mostrarReta && isFinite(P.a)) {
        ct.fillStyle = G.COR.vinho; ct.font = '600 11px system-ui, sans-serif';
        ct.textAlign = 'left'; ct.textBaseline = 'top';
        ct.fillText('y = ' + M.fmt(P.a, 3) + 'x ' + (P.b >= 0 ? '+ ' : '− ')
                    + M.fmt(Math.abs(P.b), 3), g.x0 + 8, g.y0 + 6);
      }
    }

    iX.value = PARES.altura.x.join(', ');
    iY.value = PARES.altura.y.join(', ');
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Regressão linear simples pelos mínimos quadrados
     ================================================================= */
  var REG = {
    pendulo: { rot: 'Pêndulo: T² × L', rx: 'comprimento L (m)', ry: 'T² (s²)',
      x: [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10],
      y: [0.8317, 1.2056, 1.6002, 1.9881, 2.4336, 2.8595, 3.2184, 3.6252, 4.0562, 4.4352] },
    ohm: { rot: 'Lei de Ohm: V × I', rx: 'corrente I (A)', ry: 'tensão V (V)',
      x: [0.020, 0.040, 0.060, 0.080, 0.100, 0.120, 0.140, 0.160],
      y: [0.95, 1.96, 2.76, 3.82, 4.68, 5.62, 6.69, 7.53] },
    altura: { rot: 'Altura × peso', rx: 'altura (cm)', ry: 'peso (kg)',
      x: [165, 170, 175, 168, 172, 180, 160, 175, 165, 170],
      y: [60, 65, 70, 68, 72, 80, 55, 75, 62, 68] },
    a1: { rot: 'Anscombe I (bem comportado)', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68] },
    a2: { rot: 'Anscombe II (curvatura)', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74] },
    a3: { rot: 'Anscombe III (um ponto atípico)', rx: 'x', ry: 'y',
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73] }
  };

  /* ajuste por mínimos quadrados, com toda a decomposição da variação */
  function mmq(x, y) {
    var n = x.length, i;
    var mx = 0, my = 0;
    for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
    mx /= n; my /= n;
    var Sxx = 0, Syy = 0, Sxy = 0;
    for (i = 0; i < n; i++) {
      Sxx += (x[i] - mx) * (x[i] - mx);
      Syy += (y[i] - my) * (y[i] - my);
      Sxy += (x[i] - mx) * (y[i] - my);
    }
    var a = Sxy / Sxx, b = my - a * mx;
    var SQT = Syy, SQE = a * Sxy, SQR = SQT - SQE;
    var gl = n - 2;
    var se = gl > 0 ? Math.sqrt(SQR / gl) : NaN;      /* erro padrão da estimativa */
    var sea = se / Math.sqrt(Sxx);                     /* erro padrão da inclinação */
    var seb = se * Math.sqrt(1 / n + mx * mx / Sxx);   /* erro padrão do intercepto */
    var r2 = SQT > 0 ? SQE / SQT : NaN;
    var res = [];
    for (i = 0; i < n; i++) res.push(y[i] - (a * x[i] + b));
    return { n: n, mx: mx, my: my, Sxx: Sxx, Syy: Syy, Sxy: Sxy,
             a: a, b: b, SQT: SQT, SQE: SQE, SQR: SQR, gl: gl,
             se: se, sea: sea, seb: seb, r2: r2, r: Math.sign(a) * Math.sqrt(r2),
             ta: a / sea, tb: b / seb, res: res };
  }

  /* escala simétrica arredondada para os gráficos de resíduo */
  function escalaRes(m) {
    if (!isFinite(m) || m <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log10(m)));
    var r = m / e;
    var mult = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
    return mult * e;
  }

  function regressao(raiz) {
    var c = moldura(raiz, 'Laboratório de regressão: a reta dos mínimos quadrados');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'pendulo', vista = 'disp', x0 = null;

    var campoD = el('div', { class: 'campo', style: 'flex:2 1 230px' });
    campoD.appendChild(el('label', { html: 'Conjunto de dados' }));
    var selD = el('select');
    Object.keys(REG).forEach(function (k) {
      selD.appendChild(el('option', { value: k, texto: REG[k].rot }));
    });
    campoD.appendChild(selD); ctr.appendChild(campoD);
    selD.addEventListener('change', function () {
      chave = selD.value;
      iX.value = REG[chave].x.join(', ');
      iY.value = REG[chave].y.join(', ');
      atualizar();
    });

    var campoV = el('div', { class: 'campo' });
    campoV.appendChild(el('label', { html: 'O que mostrar' }));
    var selV = el('select');
    [['disp', 'Dispersão, reta e bandas'], ['res', 'Gráfico de resíduos'],
     ['qq', 'Normalidade dos resíduos']].forEach(function (o) {
      selV.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoV.appendChild(selV); ctr.appendChild(campoV);
    selV.addEventListener('change', function () { vista = selV.value; atualizar(); });

    var campoP = el('div', { class: 'campo' });
    campoP.appendChild(el('label', { html: 'Prever em x₀ <i>(opcional)</i>' }));
    var iP = el('input', { type: 'number', step: 'any', placeholder: 'ex.: 0,75' });
    campoP.appendChild(iP); ctr.appendChild(campoP);
    iP.addEventListener('input', function () {
      x0 = iP.value === '' ? null : Number(iP.value); atualizar();
    });

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoX = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoX.appendChild(el('label', { html: 'valores de x' }));
    var iX = el('input', { type: 'text' }); campoX.appendChild(iX); ctr2.appendChild(campoX);
    var campoY = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoY.appendChild(el('label', { html: 'valores de y' }));
    var iY = el('input', { type: 'text' }); campoY.appendChild(iY); ctr2.appendChild(campoY);
    iX.addEventListener('input', atualizar);
    iY.addEventListener('input', atualizar);

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'inclinação a', k: 'a' }, { rot: 'erro de a', k: 'sa' },
      { rot: 'intercepto b', k: 'b' }, { rot: 'erro de b', k: 'sb' },
      { rot: 'r²', k: 'r2' }, { rot: 'erro padrão sₑ', k: 'se' }
    ]);
    var anova = el('div', { class: 'saida' }); c.appendChild(anova);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function marcar(g, px, py, cor, raio) {
      var ct = g.ct;
      ct.fillStyle = cor;
      ct.beginPath();
      ct.arc(px, py, raio || 4, 0, 2 * Math.PI);
      ct.fill();
      ct.strokeStyle = '#fff'; ct.lineWidth = 1.2; ct.stroke();
    }

    function atualizar() {
      var x = ler(iX.value), y = ler(iY.value);
      var n = Math.min(x.length, y.length);
      if (n < 3) {
        saida.innerHTML = 'Informe ao menos três pares (x, y).';
        anova.innerHTML = '';
        painel({ a: '—', sa: '—', b: '—', sb: '—', r2: '—', se: '—' });
        G.preparar(cv, 300);
        return;
      }
      x = x.slice(0, n); y = y.slice(0, n);
      var R = mmq(x, y);
      var tc = M.tCritico(0.025, R.gl);
      var pA = 2 * (1 - M.FT(Math.abs(R.ta), R.gl));
      var pB = 2 * (1 - M.FT(Math.abs(R.tb), R.gl));

      painel({
        a: M.fmt(R.a, 4), sa: '±' + M.fmt(R.sea, 4),
        b: M.fmt(R.b, 4), sb: '±' + M.fmt(R.seb, 4),
        r2: M.fmt(R.r2, 5), se: M.fmt(R.se, 4)
      });

      if (vista === 'disp') desenharDisp(x, y, R, tc);
      else if (vista === 'res') desenharRes(x, R);
      else desenharQQ(R);

      /* ----- decomposição da variação ----- */
      anova.innerHTML =
        '<b>Decomposição da variação.</b> '
        + 'SQT = <b>' + M.fmt(R.SQT, 4) + '</b> &nbsp;=&nbsp; '
        + 'SQE (explicada pela reta) = <b>' + M.fmt(R.SQE, 4) + '</b> &nbsp;+&nbsp; '
        + 'SQR (residual) = <b>' + M.fmt(R.SQR, 4) + '</b>. '
        + 'A razão SQE/SQT é exatamente o r² = <b>' + M.pct(R.r2, 2) + '</b>, '
        + 'e sₑ = √(SQR/(n−2)) = <b>' + M.fmt(R.se, 4) + '</b> é o desvio típico de um ponto '
        + 'em torno da reta: nas mesmas unidades de y.';

      /* ----- texto principal ----- */
      var rotY = REG[chave] ? REG[chave].ry : 'y';
      var rotX = REG[chave] ? REG[chave].rx : 'x';
      var txt = 'Reta ajustada: <b>ŷ = ' + M.fmt(R.a, 4) + ' x '
        + (R.b >= 0 ? '+ ' : '− ') + M.fmt(Math.abs(R.b), 4) + '</b>.<br>'
        + 'Cada unidade a mais de ' + rotX + ' corresponde, em média, a <b>'
        + M.fmt(R.a, 4) + '</b> unidade(s) a mais de ' + rotY + '.';

      txt += '<br><br><b>Inclinação:</b> t = a/s<sub>a</sub> = ' + M.fmt(R.ta, 3)
        + ' com ν = ' + R.gl + ', crítico ' + M.fmt(tc, 3) + ' a 5%: '
        + (pA < 0.05
            ? '<b>significativa</b> (p = ' + M.fmt(pA, 5) + '): há relação linear entre as duas variáveis.'
            : '<b>não significativa</b> (p = ' + M.fmt(pA, 4) + '): os dados são compatíveis com inclinação nula.')
        + ' IC 95% para a inclinação: <b>[' + M.fmt(R.a - tc * R.sea, 4) + ' ; '
        + M.fmt(R.a + tc * R.sea, 4) + ']</b>.';

      txt += '<br><br><b>Intercepto:</b> b = ' + M.fmt(R.b, 4) + ' ± ' + M.fmt(R.seb, 4)
        + ', IC 95% [' + M.fmt(R.b - tc * R.seb, 4) + ' ; ' + M.fmt(R.b + tc * R.seb, 4) + ']. '
        + (pB < 0.05
            ? 'É <b>diferente de zero</b> (p = ' + M.fmt(pB, 4) + ').'
            : 'É <b>compatível com zero</b> (p = ' + M.fmt(pB, 3) + '): se a teoria prevê que a '
              + 'reta passe pela origem, os dados não a contradizem.');

      /* ----- previsão ----- */
      if (x0 !== null && isFinite(x0)) {
        var yh = R.a * x0 + R.b;
        var raizM = Math.sqrt(1 / R.n + Math.pow(x0 - R.mx, 2) / R.Sxx);
        var raizP = Math.sqrt(1 + 1 / R.n + Math.pow(x0 - R.mx, 2) / R.Sxx);
        var fora = x0 < Math.min.apply(null, x) || x0 > Math.max.apply(null, x);
        txt += '<br><br><b>Previsão em x₀ = ' + M.fmt(x0, 4) + ':</b> ŷ = <b>'
          + M.fmt(yh, 4) + '</b>.<br>'
          + 'IC 95% para a <i>média</i> de y nesse x₀: ['
          + M.fmt(yh - tc * R.se * raizM, 4) + ' ; ' + M.fmt(yh + tc * R.se * raizM, 4) + ']<br>'
          + 'Intervalo de <i>previsão</i> para uma nova observação: ['
          + M.fmt(yh - tc * R.se * raizP, 4) + ' ; ' + M.fmt(yh + tc * R.se * raizP, 4) + ']'
          + '<br>O segundo é bem mais largo porque carrega, além da incerteza da reta, a '
          + 'dispersão natural de um ponto individual em torno dela.'
          + (fora ? ' <b>Atenção:</b> x₀ está <b>fora</b> da faixa observada: isso é '
                  + 'extrapolação, e a reta não tem autoridade nenhuma ali.' : '');
      }

      /* ----- diagnóstico dos resíduos ----- */
      var somaRes = R.res.reduce(function (s, v) { return s + v; }, 0);
      var dag = R.n >= 8 ? M.dagostino(R.res) : null;
      txt += '<br><br><b>Resíduos:</b> somam ' + M.fmt(somaRes, 6)
        + ' (sempre zero, por construção: a reta é escolhida para que isso aconteça). ';
      if (dag) {
        txt += 'O teste de D’Agostino sobre eles dá p = <b>' + M.fmt(dag.p, 4) + '</b>: '
          + (dag.p < 0.05
              ? 'há evidência contra a normalidade dos resíduos, e os intervalos acima devem ser '
                + 'lidos com reserva.'
              : 'nada contra a hipótese de resíduos normais.');
      } else {
        txt += 'Com n &lt; 8 não há como testar sua normalidade de forma confiável.';
      }
      txt += ' Troque a vista para <i>Gráfico de resíduos</i>: se sobrar qualquer padrão '
        + 'visível ali (curvatura, funil, degrau) a reta não é o modelo certo.';

      saida.innerHTML = txt;
    }

    function desenharDisp(x, y, R, tc) {
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var fx = (xmax - xmin) * 0.12 || 1;
      var X0 = xmin - fx, X1 = xmax + fx;
      if (x0 !== null && isFinite(x0)) { X0 = Math.min(X0, x0 - fx / 2); X1 = Math.max(X1, x0 + fx / 2); }

      function banda(v, k) {
        return tc * R.se * Math.sqrt(k + 1 / R.n + Math.pow(v - R.mx, 2) / R.Sxx);
      }
      var ymin = Math.min.apply(null, y), ymax = Math.max.apply(null, y);
      ymin = Math.min(ymin, R.a * X0 + R.b - banda(X0, 1), R.a * X1 + R.b - banda(X1, 1));
      ymax = Math.max(ymax, R.a * X0 + R.b + banda(X0, 1), R.a * X1 + R.b + banda(X1, 1));
      var fy = (ymax - ymin) * 0.08 || 1;

      var g = G.eixos(cv, {
        xmin: X0, xmax: X1, ymin: ymin - fy, ymax: ymax + fy, altura: 320,
        rotX: REG[chave] ? REG[chave].rx : 'x',
        rotY: REG[chave] ? REG[chave].ry : 'y',
        marcasX: G.marcasLineares(X0, X1, 6, (xmax - xmin) > 20 ? 0 : 2),
        formataY: function (v) { return M.fmt(v, (ymax - ymin) > 20 ? 0 : 2); }
      });
      var ct = g.ct, i, v;

      /* bandas: previsão (mais larga, clara) e média (estreita) */
      [[1, 'rgba(181,131,31,.13)'], [0, 'rgba(31,78,121,.20)']].forEach(function (par) {
        ct.fillStyle = par[1];
        ct.beginPath();
        for (i = 0; i <= 120; i++) {
          v = X0 + (X1 - X0) * i / 120;
          var py = g.Y(R.a * v + R.b + banda(v, par[0]));
          if (i === 0) ct.moveTo(g.X(v), py); else ct.lineTo(g.X(v), py);
        }
        for (i = 120; i >= 0; i--) {
          v = X0 + (X1 - X0) * i / 120;
          ct.lineTo(g.X(v), g.Y(R.a * v + R.b - banda(v, par[0])));
        }
        ct.closePath(); ct.fill();
      });

      /* resíduos verticais */
      ct.strokeStyle = 'rgba(140,47,57,.45)'; ct.lineWidth = 1; ct.setLineDash([3, 3]);
      for (i = 0; i < x.length; i++) {
        ct.beginPath();
        ct.moveTo(g.X(x[i]), g.Y(y[i]));
        ct.lineTo(g.X(x[i]), g.Y(R.a * x[i] + R.b));
        ct.stroke();
      }
      ct.setLineDash([]);

      /* reta */
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.4;
      ct.beginPath();
      ct.moveTo(g.X(X0), g.Y(R.a * X0 + R.b));
      ct.lineTo(g.X(X1), g.Y(R.a * X1 + R.b));
      ct.stroke();

      /* centroide e pontos */
      for (i = 0; i < x.length; i++) marcar(g, g.X(x[i]), g.Y(y[i]), G.COR.azul, 4.2);
      marcar(g, g.X(R.mx), g.Y(R.my), '#b5831f', 6);

      if (x0 !== null && isFinite(x0)) {
        G.vertical(g, x0, '#2e7d4f', 'x₀');
        marcar(g, g.X(x0), g.Y(R.a * x0 + R.b), '#2e7d4f', 5);
      }

      legenda.innerHTML = 'Pontos azuis: dados &nbsp;·&nbsp; linha vinho: reta dos mínimos '
        + 'quadrados &nbsp;·&nbsp; tracejado: resíduos &nbsp;·&nbsp; faixa azul: IC 95% da '
        + '<b>média</b> de y &nbsp;·&nbsp; faixa clara: intervalo de <b>previsão</b> &nbsp;·&nbsp; '
        + 'ponto dourado: o centroide (x̄, ȳ), por onde a reta sempre passa.';
    }

    function desenharRes(x, R) {
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var fx = (xmax - xmin) * 0.1 || 1;
      var m = escalaRes(Math.max.apply(null, R.res.map(Math.abs)) * 1.25);
      var g = G.eixos(cv, {
        xmin: xmin - fx, xmax: xmax + fx, ymin: -m, ymax: m, altura: 300, divY: 4,
        rotX: REG[chave] ? REG[chave].rx : 'x', rotY: 'resíduo  y − ŷ',
        marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, (xmax - xmin) > 20 ? 0 : 2),
        formataY: function (v) { return M.fmt(v, 2); }
      });
      var ct = g.ct, i;
      /* faixa de ±2 sₑ */
      ct.fillStyle = 'rgba(31,78,121,.10)';
      ct.fillRect(g.X(g.xmin), g.Y(2 * R.se), g.X(g.xmax) - g.X(g.xmin),
                  g.Y(-2 * R.se) - g.Y(2 * R.se));
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 1.6;
      ct.beginPath(); ct.moveTo(g.X(g.xmin), g.Y(0)); ct.lineTo(g.X(g.xmax), g.Y(0)); ct.stroke();
      for (i = 0; i < x.length; i++) {
        ct.strokeStyle = 'rgba(31,78,121,.5)'; ct.lineWidth = 1;
        ct.beginPath(); ct.moveTo(g.X(x[i]), g.Y(0)); ct.lineTo(g.X(x[i]), g.Y(R.res[i])); ct.stroke();
        marcar(g, g.X(x[i]), g.Y(R.res[i]), G.COR.azul, 4.2);
      }
      legenda.innerHTML = 'Faixa azul: ±2sₑ, onde devem cair cerca de 95% dos resíduos. '
        + 'O que se procura aqui é <b>ausência de padrão</b>: pontos espalhados ao acaso em '
        + 'torno do zero. Curvatura denuncia modelo errado; abertura em funil denuncia '
        + 'variância não constante.';
    }

    function desenharQQ(R) {
      var r = R.res.slice().sort(function (p, q) { return p - q; });
      var n = r.length, i, teo = [], s = R.se;
      for (i = 0; i < n; i++) teo.push(M.zCritico((i + 1 - 0.375) / (n + 0.25)) * s);
      var lim = Math.max(Math.max.apply(null, r.map(Math.abs)),
                         Math.max.apply(null, teo.map(Math.abs))) * 1.2;
      var g = G.eixos(cv, {
        xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, altura: 300,
        rotX: 'quantil teórico (normal)', rotY: 'resíduo observado',
        marcasX: G.marcasLineares(-lim, lim, 6, 2),
        formataY: function (v) { return M.fmt(v, 2); }
      });
      var ct = g.ct;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2; ct.setLineDash([6, 4]);
      ct.beginPath(); ct.moveTo(g.X(-lim), g.Y(-lim)); ct.lineTo(g.X(lim), g.Y(lim)); ct.stroke();
      ct.setLineDash([]);
      for (i = 0; i < n; i++) marcar(g, g.X(teo[i]), g.Y(r[i]), G.COR.azul, 4.2);
      legenda.innerHTML = 'Se os resíduos forem normais, os pontos acompanham a diagonal. '
        + 'Curvatura nas pontas indica caudas pesadas ou assimetria: o mesmo diagnóstico '
        + 'do Módulo 11, aplicado agora ao que sobrou depois do ajuste.';
    }

    iX.value = REG.pendulo.x.join(', ');
    iY.value = REG.pendulo.y.join(', ');
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Linearização de leis físicas
     ================================================================= */
  var LEIS = {
    pendulo: {
      rot: 'Pêndulo simples',
      x: [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10],
      y: [0.912, 1.098, 1.265, 1.410, 1.560, 1.691, 1.794, 1.904, 2.014, 2.106],
      rx: 'L (m)', ry: 'T (s)',
      lei: 'T = 2π√(L/g)',
      opcoes: [
        { k: 'cru', rot: 'T contra L (sem transformar)', fx: function (v) { return v; },
          fy: function (v) { return v; }, rx: 'L (m)', ry: 'T (s)' },
        { k: 'quad', rot: 'T² contra L  ✓', fx: function (v) { return v; },
          fy: function (v) { return v * v; }, rx: 'L (m)', ry: 'T² (s²)' },
        { k: 'log', rot: 'ln T contra ln L', fx: Math.log, fy: Math.log,
          rx: 'ln L', ry: 'ln T' }
      ],
      extrai: function (op, R) {
        if (op === 'quad')
          return { nome: 'g', valor: 4 * Math.PI * Math.PI / R.a,
                   erro: 4 * Math.PI * Math.PI / R.a * (R.sea / R.a), un: 'm/s²',
                   esperado: 9.78,
                   nota: 'A inclinação da reta T² × L é 4π²/g, de modo que g = 4π²/a. '
                       + 'O intercepto deve ser compatível com zero, e é.' };
        if (op === 'log')
          return { nome: 'expoente de L', valor: R.a, erro: R.sea, un: '',
                   esperado: 0.5,
                   nota: 'Num gráfico log–log a inclinação é o expoente da lei de potência. '
                       + 'O valor 0,5 confirma a dependência com a raiz quadrada de L.' };
        return { nome: '—', valor: NaN, erro: NaN, un: '',
                 nota: 'Sem transformar não há constante física extraível: a inclinação de '
                     + 'T contra L não corresponde a grandeza alguma, e o intercepto afirma '
                     + 'que um pêndulo de comprimento nulo oscilaria com período não nulo.' };
      }
    },
    decaimento: {
      rot: 'Decaimento radioativo',
      x: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
      y: [1974, 1611, 1228, 1010, 797, 633, 490, 416, 331, 233],
      rx: 't (min)', ry: 'contagens N',
      lei: 'N = N₀ e^{-λt}',
      opcoes: [
        { k: 'cru', rot: 'N contra t (sem transformar)', fx: function (v) { return v; },
          fy: function (v) { return v; }, rx: 't (min)', ry: 'N' },
        { k: 'log', rot: 'ln N contra t  ✓', fx: function (v) { return v; }, fy: Math.log,
          rx: 't (min)', ry: 'ln N' }
      ],
      extrai: function (op, R) {
        if (op === 'log')
          return { nome: 'meia-vida', valor: Math.log(2) / (-R.a),
                   erro: Math.log(2) / (R.a * R.a) * R.sea, un: 'min', esperado: 15,
                   nota: 'A inclinação é −λ, e a meia-vida é ln2/λ. O intercepto dá '
                       + 'ln N₀ = ' + M.fmt(R.b, 3) + ', ou seja, N₀ ≈ '
                       + M.fmt(Math.exp(R.b), 0) + ' contagens.' };
        return { nome: '—', valor: NaN, erro: NaN, un: '',
                 nota: 'A reta sobre os dados crus não serve: o decaimento é exponencial, e '
                     + 'qualquer reta vai subestimar o início e superestimar o fim. Repare na '
                     + 'curvatura evidente no gráfico de resíduos.' };
      }
    },
    ohm: {
      rot: 'Lei de Ohm',
      x: [0.020, 0.040, 0.060, 0.080, 0.100, 0.120, 0.140, 0.160],
      y: [0.95, 1.96, 2.76, 3.82, 4.68, 5.62, 6.69, 7.53],
      rx: 'I (A)', ry: 'V (V)',
      lei: 'V = R I',
      opcoes: [
        { k: 'cru', rot: 'V contra I  ✓ (já é linear)', fx: function (v) { return v; },
          fy: function (v) { return v; }, rx: 'I (A)', ry: 'V (V)' }
      ],
      extrai: function (op, R) {
        return { nome: 'resistência R', valor: R.a, erro: R.sea, un: 'Ω', esperado: 47,
                 nota: 'Aqui a lei já é linear e nenhuma transformação é necessária. A '
                     + 'inclinação é a própria resistência, e o intercepto, compatível com '
                     + 'zero, confirma que não há tensão de offset no circuito.' };
      }
    }
  };

  function linearizacao(raiz) {
    var c = moldura(raiz, 'Linearização: extrair a constante física de uma reta');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'pendulo', op = 'cru';

    var campoL = el('div', { class: 'campo', style: 'flex:2 1 200px' });
    campoL.appendChild(el('label', { html: 'Experimento' }));
    var selL = el('select');
    Object.keys(LEIS).forEach(function (k) {
      selL.appendChild(el('option', { value: k, texto: LEIS[k].rot }));
    });
    campoL.appendChild(selL); ctr.appendChild(campoL);

    var campoO = el('div', { class: 'campo', style: 'flex:2 1 220px' });
    campoO.appendChild(el('label', { html: 'Como gráficar' }));
    var selO = el('select');
    campoO.appendChild(selO); ctr.appendChild(campoO);

    function preencherOpcoes() {
      selO.innerHTML = '';
      LEIS[chave].opcoes.forEach(function (o) {
        selO.appendChild(el('option', { value: o.k, texto: o.rot }));
      });
      op = LEIS[chave].opcoes[0].k;
      selO.value = op;
    }
    preencherOpcoes();

    selL.addEventListener('change', function () {
      chave = selL.value; preencherOpcoes(); atualizar();
    });
    selO.addEventListener('change', function () { op = selO.value; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    var cv2 = el('canvas'); c.appendChild(cv2);
    c.appendChild(el('div', { class: 'legenda', html:
      'Acima: os dados no sistema de eixos escolhido, com a reta ajustada. '
      + 'Abaixo: os resíduos desse ajuste: é neles que a transformação errada se denuncia.' }));
    var painel = cartoes(c, [
      { rot: 'inclinação', k: 'a' }, { rot: 'intercepto', k: 'b' },
      { rot: 'r²', k: 'r2' }, { rot: 'constante extraída', k: 'g' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var L = LEIS[chave];
      var cfg = L.opcoes.filter(function (o) { return o.k === op; })[0] || L.opcoes[0];
      var x = L.x.map(cfg.fx), y = L.y.map(cfg.fy);
      var R = mmq(x, y);
      var E = L.extrai(op, R);

      painel({
        a: M.fmt(R.a, 4), b: M.fmt(R.b, 4), r2: M.fmt(R.r2, 6),
        g: isFinite(E.valor) ? M.fmt(E.valor, 3) + (E.un ? ' ' + E.un : '') : '—'
      });

      /* gráfico principal */
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var ymin = Math.min.apply(null, y), ymax = Math.max.apply(null, y);
      var fx = (xmax - xmin) * 0.1, fy = (ymax - ymin) * 0.12;
      var g1 = G.eixos(cv, {
        xmin: xmin - fx, xmax: xmax + fx, ymin: ymin - fy, ymax: ymax + fy, altura: 270,
        rotX: cfg.rx, rotY: cfg.ry,
        marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 2),
        formataY: function (v) { return M.fmt(v, Math.abs(ymax - ymin) > 50 ? 0 : 2); }
      });
      var ct = g1.ct, i;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.2;
      ct.beginPath();
      ct.moveTo(g1.X(g1.xmin), g1.Y(R.a * g1.xmin + R.b));
      ct.lineTo(g1.X(g1.xmax), g1.Y(R.a * g1.xmax + R.b));
      ct.stroke();
      for (i = 0; i < x.length; i++) {
        ct.fillStyle = G.COR.azul;
        ct.beginPath(); ct.arc(g1.X(x[i]), g1.Y(y[i]), 4.2, 0, 2 * Math.PI); ct.fill();
        ct.strokeStyle = '#fff'; ct.lineWidth = 1.2; ct.stroke();
      }

      /* resíduos */
      var m = escalaRes(Math.max.apply(null, R.res.map(Math.abs)) * 1.3);
      var g2 = G.eixos(cv2, {
        xmin: xmin - fx, xmax: xmax + fx, ymin: -m, ymax: m, altura: 190, divY: 4,
        rotX: cfg.rx, rotY: 'resíduo',
        marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 2),
        formataY: function (v) { return M.fmt(v, m < 0.1 ? 3 : m < 1 ? 2 : 1); }
      });
      var c2 = g2.ct;
      c2.strokeStyle = G.COR.vinho; c2.lineWidth = 1.6;
      c2.beginPath(); c2.moveTo(g2.X(g2.xmin), g2.Y(0)); c2.lineTo(g2.X(g2.xmax), g2.Y(0)); c2.stroke();
      for (i = 0; i < x.length; i++) {
        c2.strokeStyle = 'rgba(31,78,121,.5)'; c2.lineWidth = 1;
        c2.beginPath(); c2.moveTo(g2.X(x[i]), g2.Y(0)); c2.lineTo(g2.X(x[i]), g2.Y(R.res[i])); c2.stroke();
        c2.fillStyle = G.COR.azul;
        c2.beginPath(); c2.arc(g2.X(x[i]), g2.Y(R.res[i]), 3.6, 0, 2 * Math.PI); c2.fill();
      }

      /* troca de sinal dos resíduos: detector simples de curvatura */
      var trocas = 0;
      for (i = 1; i < R.res.length; i++)
        if (R.res[i] * R.res[i - 1] < 0) trocas++;
      var esperadas = (R.res.length - 1) / 2;

      var txt = 'Lei: <b>' + L.lei + '</b> &nbsp;·&nbsp; ajuste de <b>' + cfg.ry
        + '</b> contra <b>' + cfg.rx + '</b> &nbsp;·&nbsp; r² = <b>' + M.fmt(R.r2, 6) + '</b>.';

      if (isFinite(E.valor)) {
        txt += '<br><br><b>' + E.nome + ' = ' + M.fmt(E.valor, 3) + ' ± '
          + M.fmt(E.erro, 3) + ' ' + E.un + '</b>';
        if (E.esperado !== undefined) {
          var desv = Math.abs(E.valor - E.esperado) / E.erro;
          txt += ': valor de referência ' + M.fmt(E.esperado, 3) + ' ' + E.un
            + ', a <b>' + M.fmt(desv, 1) + ' σ</b> do obtido'
            + (desv < 2 ? ', portanto em pleno acordo.'
                        : ', o que merece investigação de erros sistemáticos.');
        }
      }
      txt += '<br><br>' + E.nota;

      txt += '<br><br><b>Leitura dos resíduos:</b> houve <b>' + trocas
        + '</b> troca(s) de sinal, contra as ' + M.fmt(esperadas, 1)
        + ' esperadas se eles fossem puramente aleatórios. '
        + (trocas < esperadas * 0.55
            ? 'Poucas trocas significam que os resíduos vêm em blocos de mesmo sinal: a '
              + '<b>assinatura inconfundível de curvatura</b>. A reta está errada, por mais '
              + 'alto que seja o r².'
            : 'Esse número é compatível com resíduos aleatórios: não há curvatura aparente.');

      txt += '<br><br><i>Repare que o r² quase nunca denuncia sozinho o modelo errado.</i> '
        + 'Ele pode passar de 0,98 e ainda assim esconder uma curvatura sistemática. Quem '
        + 'denuncia é o gráfico de resíduos, e é por isso que ele vem junto, aqui, sempre.';

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Ajuste de polinômios por mínimos quadrados (com pesos)
     ================================================================= */

  /* resolve A p = c por eliminacao de Gauss com pivotamento parcial.
     Devolve tambem a inversa de A, de onde saem as incertezas. */
  function resolveSim(A, c) {
    var n = A.length, i, j, k;
    /* matriz aumentada [A | I | c] */
    var M2 = [];
    for (i = 0; i < n; i++) {
      var lin = A[i].slice();
      for (j = 0; j < n; j++) lin.push(i === j ? 1 : 0);
      lin.push(c[i]);
      M2.push(lin);
    }
    for (k = 0; k < n; k++) {
      var piv = k;
      for (i = k + 1; i < n; i++)
        if (Math.abs(M2[i][k]) > Math.abs(M2[piv][k])) piv = i;
      if (Math.abs(M2[piv][k]) < 1e-300) return null;
      var tmp = M2[k]; M2[k] = M2[piv]; M2[piv] = tmp;
      var d = M2[k][k];
      for (j = k; j < 2 * n + 1; j++) M2[k][j] /= d;
      for (i = 0; i < n; i++) {
        if (i === k) continue;
        var f = M2[i][k];
        if (f === 0) continue;
        for (j = k; j < 2 * n + 1; j++) M2[i][j] -= f * M2[k][j];
      }
    }
    var p = [], inv = [];
    for (i = 0; i < n; i++) {
      p.push(M2[i][2 * n]);
      inv.push(M2[i].slice(n, 2 * n));
    }
    return { p: p, inv: inv };
  }

  /* ajuste polinomial de grau m, com pesos w_i (1 se omitidos) */
  function ajustePoli(x, y, m, w) {
    var n = x.length, i, j, k, N = m + 1;
    if (n < N) return null;
    var A = [], c = [];
    for (j = 0; j < N; j++) {
      A.push(new Array(N).fill(0));
      c.push(0);
    }
    for (i = 0; i < n; i++) {
      var pw = w ? w[i] : 1;
      var pot = [1];
      for (k = 1; k < 2 * N; k++) pot.push(pot[k - 1] * x[i]);
      for (j = 0; j < N; j++) {
        for (k = 0; k < N; k++) A[j][k] += pw * pot[j + k];
        c[j] += pw * pot[j] * y[i];
      }
    }
    var sol = resolveSim(A, c);
    if (!sol) return null;
    var p = sol.p;

    function avalia(v) {
      var s = 0;
      for (var q = N - 1; q >= 0; q--) s = s * v + p[q];
      return s;
    }
    var res = [], SQR = 0, qui = 0, SQT = 0, my = 0, somaW = 0;
    for (i = 0; i < n; i++) { my += y[i]; somaW += (w ? w[i] : 1); }
    my /= n;
    for (i = 0; i < n; i++) {
      var r = y[i] - avalia(x[i]);
      res.push(r);
      SQR += r * r;
      qui += (w ? w[i] : 1) * r * r;
      SQT += (y[i] - my) * (y[i] - my);
    }
    var gl = n - N;
    /* sem pesos reais, estima-se sigma dos proprios residuos */
    var se = gl > 0 ? Math.sqrt(SQR / gl) : NaN;
    var erros = [];
    for (j = 0; j < N; j++) {
      var vjj = sol.inv[j][j];
      erros.push(w ? Math.sqrt(Math.max(0, vjj))
                   : se * Math.sqrt(Math.max(0, vjj)));
    }
    return { p: p, erros: erros, avalia: avalia, res: res, n: n, grau: m,
             gl: gl, SQR: SQR, SQT: SQT, se: se, qui: qui,
             quiRed: gl > 0 ? qui / gl : NaN,
             r2: SQT > 0 ? 1 - SQR / SQT : NaN,
             r2aj: (SQT > 0 && gl > 0) ? 1 - (SQR / gl) / (SQT / (n - 1)) : NaN };
  }

  var DADOSPOLI = {
    termo: { rot: 'Dilatação térmica de um fio (grau 1 basta)',
      rx: 'temperatura (°C)', ry: 'comprimento (mm)',
      x: [20, 30, 40, 50, 60, 70, 80, 90, 100],
      y: [1000.00, 1000.17, 1000.33, 1000.52, 1000.68, 1000.83, 1001.02, 1001.17, 1001.35],
      s: [0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04] },
    queda: { rot: 'Queda livre: posição × tempo (grau 2)',
      rx: 'tempo (s)', ry: 'posição (m)',
      x: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8],
      y: [0.012, 0.207, 0.812, 1.787, 3.154, 4.901, 7.031, 9.573, 12.504, 15.846],
      s: [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02] },
    calib: { rot: 'Calibração com incertezas desiguais (use pesos!)',
      rx: 'sinal do sensor (V)', ry: 'grandeza (unidade)',
      x: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
      y: [1.04, 2.11, 2.89, 4.08, 4.92, 6.13, 6.88, 8.09],
      s: [0.03, 0.03, 0.03, 0.03, 0.40, 0.40, 0.40, 0.40] },
    ruido: { rot: 'Dados ruidosos (cuidado com o sobreajuste)',
      rx: 'x', ry: 'y',
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [2.4, 4.1, 5.2, 7.5, 8.1, 10.4, 11.3, 13.9, 14.6, 16.8],
      s: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6] }
  };

  function polinomio(raiz) {
    var c = moldura(raiz, 'Ajuste de polinômios e mínimos quadrados ponderados');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'queda', grau = 2, usarPeso = false, vista = 'ajuste';

    var campoD = el('div', { class: 'campo', style: 'flex:3 1 300px' });
    campoD.appendChild(el('label', { html: 'Conjunto de dados' }));
    var selD = el('select');
    Object.keys(DADOSPOLI).forEach(function (k) {
      selD.appendChild(el('option', { value: k, texto: DADOSPOLI[k].rot }));
    });
    selD.value = 'queda';
    campoD.appendChild(selD); ctr.appendChild(campoD);
    selD.addEventListener('change', function () { chave = selD.value; atualizar(); });

    deslizante(ctr, 'Grau do polinômio', 1, 7, 1, 2, function (v) { grau = v; atualizar(); });

    var campoP = el('div', { class: 'campo' });
    var lblP = el('label');
    var chk = el('input', { type: 'checkbox' });
    lblP.appendChild(chk);
    lblP.appendChild(document.createTextNode(' usar pesos 1/σᵢ²'));
    campoP.appendChild(lblP); ctr.appendChild(campoP);
    chk.addEventListener('change', function () { usarPeso = chk.checked; atualizar(); });

    var campoV = el('div', { class: 'campo' });
    campoV.appendChild(el('label', { html: 'Vista' }));
    var selV = el('select');
    [['ajuste', 'Ajuste'], ['res', 'Resíduos'],
     ['graus', 'Comparar graus']].forEach(function (o) {
      selV.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoV.appendChild(selV); ctr.appendChild(campoV);
    selV.addEventListener('change', function () { vista = selV.value; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'r²', k: 'r2' }, { rot: 'r² ajustado', k: 'r2a' },
      { rot: 'χ²', k: 'qui' }, { rot: 'χ²/ν', k: 'quir' },
      { rot: 'graus de liberdade ν', k: 'gl' }
    ]);
    var tabela = el('div', { class: 'tabela-rolavel' }); c.appendChild(tabela);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var D = DADOSPOLI[chave];
      var x = D.x, y = D.y, s = D.s;
      var w = null;
      if (usarPeso) {
        w = s.map(function (v) { return 1 / (v * v); });
      }
      var R = ajustePoli(x, y, grau, w);
      if (!R) {
        saida.innerHTML = 'Grau alto demais para o número de pontos: é preciso n > grau+1.';
        painel({ r2: '—', r2a: '—', qui: '—', quir: '—', gl: '—' });
        tabela.innerHTML = ''; G.preparar(cv, 300); return;
      }

      /* chi2 sempre usando os sigmas declarados, mesmo em ajuste sem peso */
      var qui2 = 0, i;
      for (i = 0; i < x.length; i++) qui2 += R.res[i] * R.res[i] / (s[i] * s[i]);
      var quiRed = R.gl > 0 ? qui2 / R.gl : NaN;

      painel({
        r2: M.fmt(R.r2, 6), r2a: M.fmt(R.r2aj, 6),
        qui: M.fmt(qui2, 3), quir: M.fmt(quiRed, 3), gl: String(R.gl)
      });

      /* tabela dos coeficientes */
      var h = '<table><thead><tr><th>coeficiente</th><th class="num">valor</th>'
        + '<th class="num">erro padrão</th><th class="num">t = a/s</th></tr></thead><tbody>';
      for (i = 0; i < R.p.length; i++) {
        var tt = R.erros[i] > 0 ? R.p[i] / R.erros[i] : NaN;
        h += '<tr><th>a<sub>' + i + '</sub> (x<sup>' + i + '</sup>)</th><td class="num">'
          + M.fmt(R.p[i], 6) + '</td><td class="num">±' + M.fmt(R.erros[i], 6)
          + '</td><td class="num">' + M.fmt(tt, 2) + '</td></tr>';
      }
      tabela.innerHTML = h + '</tbody></table>';

      /* ---------- gráficos ---------- */
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var fx = (xmax - xmin) * 0.08;

      if (vista === 'res') {
        var m = Math.max.apply(null, R.res.map(Math.abs));
        m = Math.max(m, Math.max.apply(null, s)) * 1.4 || 1;
        var g2 = G.eixos(cv, {
          xmin: xmin - fx, xmax: xmax + fx, ymin: -m, ymax: m, altura: 300, divY: 4,
          rotX: D.rx, rotY: 'resíduo', marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 1),
          formataY: function (v) { return M.fmt(v, 3); }
        });
        var c2 = g2.ct;
        c2.strokeStyle = G.COR.vinho; c2.lineWidth = 1.6;
        c2.beginPath(); c2.moveTo(g2.X(g2.xmin), g2.Y(0));
        c2.lineTo(g2.X(g2.xmax), g2.Y(0)); c2.stroke();
        for (i = 0; i < x.length; i++) {
          /* barra de erro do ponto */
          c2.strokeStyle = 'rgba(31,78,121,.45)'; c2.lineWidth = 1.4;
          c2.beginPath();
          c2.moveTo(g2.X(x[i]), g2.Y(-s[i])); c2.lineTo(g2.X(x[i]), g2.Y(s[i])); c2.stroke();
          c2.beginPath(); c2.moveTo(g2.X(x[i]) - 4, g2.Y(s[i]));
          c2.lineTo(g2.X(x[i]) + 4, g2.Y(s[i])); c2.stroke();
          c2.beginPath(); c2.moveTo(g2.X(x[i]) - 4, g2.Y(-s[i]));
          c2.lineTo(g2.X(x[i]) + 4, g2.Y(-s[i])); c2.stroke();
          c2.fillStyle = G.COR.vinho;
          c2.beginPath(); c2.arc(g2.X(x[i]), g2.Y(R.res[i]), 4, 0, 2 * Math.PI); c2.fill();
          c2.strokeStyle = '#fff'; c2.lineWidth = 1.2; c2.stroke();
        }
        legenda.innerHTML = 'Barras azuis: a incerteza σᵢ declarada de cada ponto. '
          + 'Pontos vinho: os resíduos. Num ajuste bom, os resíduos ficam '
          + '<b>dentro</b> das barras, sem padrão.';
      } else {
        var ymin = Math.min.apply(null, y), ymax2 = Math.max.apply(null, y);
        var fy = (ymax2 - ymin) * 0.12 || 1;
        var g = G.eixos(cv, {
          xmin: xmin - fx, xmax: xmax + fx, ymin: ymin - fy, ymax: ymax2 + fy, altura: 310,
          rotX: D.rx, rotY: D.ry, marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 1),
          formataY: function (v) { return M.fmt(v, Math.abs(ymax2 - ymin) > 50 ? 0 : 2); }
        });
        var ct = g.ct;

        if (vista === 'graus') {
          var cores = ['#b5831f', G.COR.azul, G.COR.vinho, '#2e7d4f'];
          var itens = [];
          [1, 2, 3, 6].forEach(function (gq, idx) {
            var Rq = ajustePoli(x, y, gq, w);
            if (!Rq) return;
            G.curva(g, Rq.avalia, cores[idx], 2);
            itens.push({ texto: 'grau ' + gq, cor: cores[idx] });
          });
          G.legenda(g, itens);
          legenda.innerHTML = 'Quatro graus sobrepostos. Repare que o grau 6 passa mais '
            + 'perto dos pontos e <b>oscila entre eles</b>: isso é sobreajuste, não '
            + 'precisão.';
        } else {
          G.curva(g, R.avalia, G.COR.vinho, 2.4);
          legenda.innerHTML = 'Curva vinho: o polinômio de grau ' + grau
            + ' ajustado. Barras: a incerteza declarada de cada ponto.';
        }

        for (i = 0; i < x.length; i++) {
          ct.strokeStyle = 'rgba(31,78,121,.55)'; ct.lineWidth = 1.4;
          ct.beginPath();
          ct.moveTo(g.X(x[i]), g.Y(y[i] - s[i]));
          ct.lineTo(g.X(x[i]), g.Y(y[i] + s[i])); ct.stroke();
          ct.fillStyle = G.COR.azul;
          ct.beginPath(); ct.arc(g.X(x[i]), g.Y(y[i]), 4, 0, 2 * Math.PI); ct.fill();
          ct.strokeStyle = '#fff'; ct.lineWidth = 1.2; ct.stroke();
        }
      }

      /* ---------- texto ---------- */
      var txt = 'Polinômio de grau <b>' + grau + '</b> com ' + x.length + ' pontos, '
        + 'portanto ν = n − (grau+1) = <b>' + R.gl + '</b> graus de liberdade.';

      txt += '<br><br><b>Qualidade do ajuste.</b> χ² = ' + M.fmt(qui2, 3)
        + ' e χ²/ν = <b>' + M.fmt(quiRed, 3) + '</b>. ';
      if (R.gl <= 0) {
        txt += 'Com ν ≤ 0 não há como avaliar: o polinômio tem parâmetros suficientes para '
          + 'passar exatamente por todos os pontos, e isso não é ajuste, é interpolação.';
      } else if (quiRed < 0.4) {
        txt += 'Um valor <b>muito abaixo de 1</b> sugere que as incertezas σᵢ foram '
          + '<b>superestimadas</b>, ou que o modelo tem parâmetros demais e está seguindo '
          + 'o ruído.';
      } else if (quiRed <= 2) {
        txt += 'Está <b>próximo de 1</b>, que é o esperado quando o modelo é adequado e as '
          + 'incertezas foram bem estimadas: cada ponto desvia-se tipicamente de um σ.';
      } else {
        txt += 'Um valor <b>bem acima de 1</b> indica que o modelo não dá conta dos dados, '
          + 'ou que as incertezas foram subestimadas. Olhe o gráfico de resíduos para '
          + 'distinguir os dois casos: padrão sistemático aponta modelo errado; dispersão '
          + 'sem padrão aponta σ subestimado.';
      }

      txt += '<br><br><b>r² e r² ajustado.</b> r² = ' + M.fmt(R.r2, 6)
        + ' e r²<sub>aj</sub> = ' + M.fmt(R.r2aj, 6) + '. '
        + 'O r² comum <b>nunca diminui</b> quando se aumenta o grau: ele só pode melhorar, '
        + 'mesmo que o grau extra esteja seguindo ruído. Por isso ele é inútil para '
        + 'escolher o grau. Já o r² ajustado desconta os graus de liberdade gastos e '
        + '<b>piora</b> quando o parâmetro a mais não compensa. <i>Suba o grau e compare '
        + 'os dois cartões.</i>';

      if (usarPeso) {
        var smin = Math.min.apply(null, s), smax = Math.max.apply(null, s);
        txt += '<br><br><b>Pesos ativos.</b> Cada ponto entra com w = 1/σᵢ². Como os σ vão '
          + 'de ' + M.fmt(smin, 3) + ' a ' + M.fmt(smax, 3) + ', o ponto mais preciso pesa '
          + '<b>' + M.fmt((smax * smax) / (smin * smin), 0) + ' vezes</b> mais que o menos '
          + 'preciso. Desmarque a caixa e compare os coeficientes: sem peso, as medidas '
          + 'ruins puxam o ajuste tanto quanto as boas.';
      } else if (Math.max.apply(null, s) / Math.min.apply(null, s) > 2) {
        txt += '<br><br><b>Atenção:</b> os σᵢ deste conjunto são muito desiguais '
          + '(de ' + M.fmt(Math.min.apply(null, s), 3) + ' a '
          + M.fmt(Math.max.apply(null, s), 3) + '). Sem pesos, os mínimos quadrados tratam '
          + 'todos os pontos como igualmente confiáveis, o que é errado. '
          + '<b>Marque a caixa de pesos</b> e veja os coeficientes mudarem.';
      }

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Ajuste não linear por Gauss–Newton amortecido, com qui-quadrado
     ================================================================= */
  var MODELOS = {
    exp: {
      rot: 'Decaimento exponencial:  y = A e^(−λx)',
      pars: ['A', 'λ'], ini: [2000, 0.05],
      f: function (p, x) { return p[0] * Math.exp(-p[1] * x); },
      d: function (p, x) {
        var e = Math.exp(-p[1] * x);
        return [e, -p[0] * x * e];
      },
      lin: { rot: 'ln y contra x', ty: Math.log, tx: function (v) { return v; },
             volta: function (a, b) { return [Math.exp(b), -a]; } },
      x: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
      y: [1974, 1611, 1228, 1010, 797, 633, 490, 416, 331, 233],
      s: null,   /* Poisson: sigma = sqrt(N) */
      poisson: true,
      rx: 't (min)', ry: 'contagens N'
    },
    pot: {
      rot: 'Lei de potência:  y = A x^b',
      pars: ['A', 'b'], ini: [1, 0.5],
      f: function (p, x) { return p[0] * Math.pow(x, p[1]); },
      d: function (p, x) {
        var q = Math.pow(x, p[1]);
        return [q, p[0] * q * Math.log(x)];
      },
      lin: { rot: 'ln y contra ln x', ty: Math.log, tx: Math.log,
             volta: function (a, b) { return [Math.exp(b), a]; } },
      x: [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10],
      y: [0.912, 1.098, 1.265, 1.410, 1.560, 1.691, 1.794, 1.904, 2.014, 2.106],
      s: [0.011, 0.011, 0.011, 0.011, 0.011, 0.011, 0.011, 0.011, 0.011, 0.011],
      rx: 'L (m)', ry: 'T (s)'
    },
    gauss: {
      rot: 'Pico gaussiano:  y = A exp[−(x−μ)²/2σ²] + C',
      pars: ['A', 'μ', 'σ', 'C'], ini: [100, 50, 5, 10],
      f: function (p, x) {
        return p[0] * Math.exp(-Math.pow(x - p[1], 2) / (2 * p[2] * p[2])) + p[3];
      },
      d: function (p, x) {
        var z = (x - p[1]) / p[2], e = Math.exp(-z * z / 2);
        return [e, p[0] * e * z / p[2], p[0] * e * z * z / p[2], 1];
      },
      lin: null,
      x: [30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70],
      y: [13, 15, 30, 51, 101, 138, 94, 55, 26, 17, 7],
      s: null, poisson: true,
      rx: 'canal', ry: 'contagens'
    }
  };

  /* Gauss-Newton com amortecimento de Levenberg */
  function gaussNewton(mod, x, y, sig, p0, maxIt) {
    var p = p0.slice(), np = p.length, n = x.length, i, j, k, it;
    var lam = 1e-3, hist = [];

    function qui(pp) {
      var s = 0;
      for (var q = 0; q < n; q++) {
        var r = (y[q] - mod.f(pp, x[q])) / sig[q];
        s += r * r;
      }
      return s;
    }
    var q0 = qui(p);
    hist.push(q0);

    for (it = 0; it < (maxIt || 200); it++) {
      var A = [], b = [];
      for (j = 0; j < np; j++) { A.push(new Array(np).fill(0)); b.push(0); }
      for (i = 0; i < n; i++) {
        var der = mod.d(p, x[i]), w = 1 / (sig[i] * sig[i]);
        var r = y[i] - mod.f(p, x[i]);
        for (j = 0; j < np; j++) {
          b[j] += w * r * der[j];
          for (k = 0; k < np; k++) A[j][k] += w * der[j] * der[k];
        }
      }
      /* amortecimento */
      var Ad = A.map(function (lin, idx) {
        var c = lin.slice(); c[idx] *= (1 + lam); return c;
      });
      var sol = resolveSim(Ad, b);
      if (!sol) break;
      var pNovo = p.map(function (v, idx) { return v + sol.p[idx]; });
      var qNovo = qui(pNovo);
      if (isFinite(qNovo) && qNovo < q0) {
        var melhora = q0 - qNovo;
        p = pNovo; q0 = qNovo; lam = Math.max(lam / 10, 1e-12);
        hist.push(q0);
        if (melhora < 1e-12 * Math.max(1, q0)) break;
      } else {
        lam *= 10;
        if (lam > 1e12) break;
      }
    }

    /* matriz de covariancia na solucao, sem amortecimento */
    var A2 = [], b2 = [];
    for (j = 0; j < np; j++) { A2.push(new Array(np).fill(0)); b2.push(0); }
    for (i = 0; i < n; i++) {
      var d2 = mod.d(p, x[i]), w2 = 1 / (sig[i] * sig[i]);
      for (j = 0; j < np; j++)
        for (k = 0; k < np; k++) A2[j][k] += w2 * d2[j] * d2[k];
    }
    var inv = resolveSim(A2, b2);
    var erros = [];
    for (j = 0; j < np; j++)
      erros.push(inv ? Math.sqrt(Math.max(0, inv.inv[j][j])) : NaN);

    return { p: p, erros: erros, qui: q0, gl: n - np,
             quiRed: (n - np) > 0 ? q0 / (n - np) : NaN,
             iter: it, hist: hist };
  }

  function naoLinear(raiz) {
    var c = moldura(raiz, 'Ajuste não linear e o qui-quadrado de ajuste');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var chave = 'exp', metodo = 'gn', vista = 'ajuste';

    var campoM = el('div', { class: 'campo', style: 'flex:3 1 320px' });
    campoM.appendChild(el('label', { html: 'Modelo e dados' }));
    var selM = el('select');
    Object.keys(MODELOS).forEach(function (k) {
      selM.appendChild(el('option', { value: k, texto: MODELOS[k].rot }));
    });
    campoM.appendChild(selM); ctr.appendChild(campoM);
    selM.addEventListener('change', function () { chave = selM.value; ajustar(); atualizar(); });

    var campoE = el('div', { class: 'campo', style: 'flex:2 1 240px' });
    campoE.appendChild(el('label', { html: 'Método' }));
    var selE = el('select');
    campoE.appendChild(selE); ctr.appendChild(campoE);
    selE.addEventListener('change', function () { metodo = selE.value; atualizar(); });

    var campoV = el('div', { class: 'campo' });
    campoV.appendChild(el('label', { html: 'Vista' }));
    var selV = el('select');
    [['ajuste', 'Ajuste'], ['res', 'Resíduos normalizados'],
     ['dist', 'Distribuição de χ²']].forEach(function (o) {
      selV.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoV.appendChild(selV); ctr.appendChild(campoV);
    selV.addEventListener('change', function () { vista = selV.value; atualizar(); });

    function ajustar() {
      selE.innerHTML = '';
      selE.appendChild(el('option', { value: 'gn', texto: 'Ajuste direto (Gauss–Newton)' }));
      if (MODELOS[chave].lin)
        selE.appendChild(el('option', { value: 'lin',
          texto: 'Linearizando: ' + MODELOS[chave].lin.rot }));
      selE.value = 'gn'; metodo = 'gn';
    }
    ajustar();

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'χ²', k: 'qui' }, { rot: 'ν', k: 'gl' },
      { rot: 'χ²/ν', k: 'quir' }, { rot: 'p do ajuste', k: 'p' },
      { rot: 'iterações', k: 'it' }
    ]);
    var tabela = el('div', { class: 'tabela-rolavel' }); c.appendChild(tabela);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var D = MODELOS[chave];
      var x = D.x, y = D.y, i;
      var sig = D.poisson ? y.map(function (v) { return Math.sqrt(Math.max(1, v)); })
                          : D.s.slice();

      var R, p, erros, quiFinal, glFinal, nIter;

      if (metodo === 'lin' && D.lin) {
        /* ajuste linear sobre os dados transformados, depois volta */
        var tx = [], ty = [];
        for (i = 0; i < x.length; i++) {
          var a = D.lin.tx(x[i]), b = D.lin.ty(y[i]);
          if (isFinite(a) && isFinite(b)) { tx.push(a); ty.push(b); }
        }
        var L = ajustePoli(tx, ty, 1, null);
        p = D.lin.volta(L.p[1], L.p[0]);
        /* erros propagados grosseiramente a partir dos do ajuste linear */
        erros = [Math.abs(p[0]) * L.erros[0], L.erros[1]];
        if (chave === 'pot') erros = [Math.abs(p[0]) * L.erros[0], L.erros[1]];
        nIter = 0;
      } else {
        R = gaussNewton(D, x, y, sig, D.ini.slice());
        p = R.p; erros = R.erros; nIter = R.iter;
      }

      /* chi2 sempre calculado da mesma forma, para comparar os dois métodos */
      quiFinal = 0;
      for (i = 0; i < x.length; i++) {
        var r = (y[i] - D.f(p, x[i])) / sig[i];
        quiFinal += r * r;
      }
      glFinal = x.length - p.length;
      var quiRed = glFinal > 0 ? quiFinal / glFinal : NaN;
      var pAjuste = glFinal > 0 ? 1 - M.FQui(quiFinal, glFinal) : NaN;

      painel({
        qui: M.fmt(quiFinal, 3), gl: String(glFinal),
        quir: M.fmt(quiRed, 4), p: M.fmt(pAjuste, 4),
        it: metodo === 'lin' ? 'direto' : String(nIter)
      });

      var h = '<table><thead><tr><th>parâmetro</th><th class="num">valor</th>'
        + '<th class="num">erro padrão</th><th class="num">erro relativo</th>'
        + '</tr></thead><tbody>';
      for (i = 0; i < p.length; i++) {
        h += '<tr><th>' + D.pars[i] + '</th><td class="num">' + M.fmt(p[i], 5)
          + '</td><td class="num">±' + M.fmt(erros[i], 5) + '</td><td class="num">'
          + M.pct(Math.abs(erros[i] / p[i]), 2) + '</td></tr>';
      }
      tabela.innerHTML = h + '</tbody></table>';

      /* ---------- gráficos ---------- */
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x);
      var fx = (xmax - xmin) * 0.06;

      if (vista === 'dist') {
        var topo = Math.max(quiFinal * 1.3, glFinal + 4 * Math.sqrt(2 * glFinal));
        var dens = function (v) { return M.dQui(v, glFinal); };
        var ym = 0;
        for (i = 1; i <= 200; i++) ym = Math.max(ym, dens(topo * i / 200));
        var gq = G.eixos(cv, {
          xmin: 0, xmax: topo, ymax: ym * 1.25, altura: 290,
          rotX: 'χ²', rotY: 'densidade sob a hipótese de bom ajuste',
          marcasX: G.marcasLineares(0, topo, 7, 0),
          formataY: function (v) { return M.fmt(v, 3); }
        });
        G.area(gq, dens, 0, Math.min(quiFinal, topo), 'rgba(31,78,121,.16)');
        G.area(gq, dens, Math.min(quiFinal, topo), topo, 'rgba(140,47,57,.28)');
        G.curva(gq, dens, G.COR.vinho, 2.2);
        G.vertical(gq, glFinal, '#b5831f', 'ν = ' + glFinal);
        if (quiFinal <= topo) G.vertical(gq, quiFinal, '#2e7d4f', 'χ² obs');
        legenda.innerHTML = 'Se o modelo estiver certo e as incertezas bem estimadas, χ² '
          + 'segue uma distribuição qui-quadrado com ν graus de liberdade, cuja <b>média é '
          + 'o próprio ν</b>. A área vermelha é o valor p do ajuste.';
      } else if (vista === 'res') {
        var m = 0, resN = [];
        for (i = 0; i < x.length; i++) {
          var rn = (y[i] - D.f(p, x[i])) / sig[i];
          resN.push(rn); m = Math.max(m, Math.abs(rn));
        }
        m = Math.max(m * 1.3, 3.2);
        var gr = G.eixos(cv, {
          xmin: xmin - fx, xmax: xmax + fx, ymin: -m, ymax: m, altura: 290, divY: 4,
          rotX: D.rx, rotY: '(y − ŷ) / σ',
          marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 1),
          formataY: function (v) { return M.fmt(v, 1); }
        });
        var cr = gr.ct;
        cr.fillStyle = 'rgba(31,78,121,.10)';
        cr.fillRect(gr.X(gr.xmin), gr.Y(2), gr.X(gr.xmax) - gr.X(gr.xmin),
                    gr.Y(-2) - gr.Y(2));
        cr.strokeStyle = G.COR.vinho; cr.lineWidth = 1.6;
        cr.beginPath(); cr.moveTo(gr.X(gr.xmin), gr.Y(0));
        cr.lineTo(gr.X(gr.xmax), gr.Y(0)); cr.stroke();
        for (i = 0; i < x.length; i++) {
          cr.strokeStyle = 'rgba(31,78,121,.5)'; cr.lineWidth = 1;
          cr.beginPath(); cr.moveTo(gr.X(x[i]), gr.Y(0));
          cr.lineTo(gr.X(x[i]), gr.Y(resN[i])); cr.stroke();
          cr.fillStyle = G.COR.azul;
          cr.beginPath(); cr.arc(gr.X(x[i]), gr.Y(resN[i]), 4, 0, 2 * Math.PI); cr.fill();
          cr.strokeStyle = '#fff'; cr.lineWidth = 1.2; cr.stroke();
        }
        legenda.innerHTML = 'Resíduos divididos pela incerteza de cada ponto. Faixa azul: '
          + '±2σ, onde devem cair cerca de 95% deles. <b>Cada ponto contribui com o '
          + 'quadrado de sua altura para o χ².</b>';
      } else {
        var ymin = Math.min.apply(null, y), ymax2 = Math.max.apply(null, y);
        var fy = (ymax2 - ymin) * 0.12 || 1;
        var g = G.eixos(cv, {
          xmin: xmin - fx, xmax: xmax + fx, ymin: Math.min(0, ymin - fy),
          ymax: ymax2 + fy, altura: 300,
          rotX: D.rx, rotY: D.ry, marcasX: G.marcasLineares(xmin - fx, xmax + fx, 6, 1),
          formataY: function (v) { return M.fmt(v, Math.abs(ymax2) > 50 ? 0 : 2); }
        });
        G.curva(g, function (v) { return D.f(p, v); }, G.COR.vinho, 2.4);
        var ct = g.ct;
        for (i = 0; i < x.length; i++) {
          ct.strokeStyle = 'rgba(31,78,121,.55)'; ct.lineWidth = 1.4;
          ct.beginPath();
          ct.moveTo(g.X(x[i]), g.Y(y[i] - sig[i]));
          ct.lineTo(g.X(x[i]), g.Y(y[i] + sig[i])); ct.stroke();
          ct.fillStyle = G.COR.azul;
          ct.beginPath(); ct.arc(g.X(x[i]), g.Y(y[i]), 4, 0, 2 * Math.PI); ct.fill();
          ct.strokeStyle = '#fff'; ct.lineWidth = 1.2; ct.stroke();
        }
        legenda.innerHTML = 'Pontos com suas barras de incerteza'
          + (D.poisson ? ' (σ = √N, por serem contagens)' : '')
          + '. Curva vinho: o modelo ajustado.';
      }

      /* ---------- texto ---------- */
      var txt = '';
      if (metodo === 'lin') {
        txt = '<b>Ajuste por linearização.</b> Transformou-se para ' + D.lin.rot
          + ', ajustou-se uma reta e voltou-se aos parâmetros originais. É direto e não '
          + 'precisa de chute inicial.'
          + '<br><br><b>Mas há um preço.</b> A transformação distorce as incertezas: pontos '
          + 'de y pequeno ganham peso relativo maior em ln y, porque '
          + '\\(\\sigma_{\\ln y}\\approx\\sigma_y/y\\). Os mínimos quadrados sobre os dados '
          + 'transformados minimizam a soma errada, e o resultado <b>não é</b> o de máxima '
          + 'verossimilhança. Troque para o ajuste direto e compare os parâmetros.';
      } else {
        txt = '<b>Ajuste direto por Gauss–Newton.</b> Partindo de um chute inicial, o método '
          + 'lineariza o modelo em torno dos parâmetros atuais, resolve o sistema normal, '
          + 'dá um passo, e repete. Convergiu em <b>' + nIter + '</b> iterações.'
          + '<br><br>A cada passo resolve-se \\((\\mathbf J^{\\mathsf T}\\mathbf W\\mathbf J)'
          + '\\,\\delta = \\mathbf J^{\\mathsf T}\\mathbf W\\mathbf r\\), onde '
          + '\\(J_{ij}=\\partial f/\\partial p_j\\) avaliada em \\(x_i\\). É a mesma equação '
          + 'normal do Módulo 9, agora recalculada a cada iteração. O amortecimento de '
          + 'Levenberg soma um termo à diagonal, o que garante que o passo não dispare '
          + 'quando a matriz fica mal condicionada.';
      }

      txt += '<br><br><b>Qualidade do ajuste.</b> χ² = ' + M.fmt(quiFinal, 3) + ' com ν = '
        + glFinal + ', logo χ²/ν = <b>' + M.fmt(quiRed, 4) + '</b> e p = <b>'
        + M.fmt(pAjuste, 4) + '</b>.<br>';
      if (quiRed > 2) {
        txt += 'Um χ²/ν <b>bem acima de 1</b>: ou o modelo não descreve os dados, ou as '
          + 'incertezas foram subestimadas. Olhe os resíduos normalizados: padrão '
          + 'sistemático aponta modelo errado, dispersão sem padrão aponta σ pequeno demais.';
      } else if (quiRed < 0.5) {
        txt += 'Um χ²/ν <b>bem abaixo de 1</b>: os resíduos são menores do que as incertezas '
          + 'declaradas permitiriam. O mais comum é que os σ tenham sido superestimados; '
          + 'a outra possibilidade é sobreajuste, com parâmetros demais.';
      } else {
        txt += 'Está <b>próximo de 1</b>, que é o esperado: cada ponto desvia-se tipicamente '
          + 'de um σ, e o modelo descreve bem os dados.';
      }

      txt += '<br><br><b>Como ler o χ²/ν.</b> Cada termo da soma é '
        + '\\(\\left[(y_i-\\hat y_i)/\\sigma_i\\right]^2\\), ou seja, o desvio medido em '
        + 'unidades da incerteza do próprio ponto. Se o modelo estiver certo, cada termo '
        + 'vale <b>cerca de 1</b> em média, e a soma de ν deles vale cerca de ν. '
        + 'Daí a regra: <b>χ²/ν ≈ 1</b>.';

      if (chave === 'exp') {
        var meia = Math.log(2) / p[1];
        var sMeia = Math.log(2) / (p[1] * p[1]) * erros[1];
        txt += '<br><br><b>Resultado físico.</b> A meia-vida é ln2/λ = <b>'
          + M.fmt(meia, 3) + ' ± ' + M.fmt(sMeia, 3) + ' min</b>, e a atividade inicial '
          + 'A = ' + M.fmt(p[0], 0) + ' ± ' + M.fmt(erros[0], 0) + ' contagens.'
          + '<br><i>Nota sobre as barras de erro:</i> por serem contagens, σ = √N '
          + '(distribuição de Poisson, Módulo 5). Pontos com mais contagens têm barra '
          + 'absoluta maior, mas incerteza <b>relativa</b> menor, e por isso pesam mais.';
      } else if (chave === 'pot') {
        txt += '<br><br><b>Resultado físico.</b> O expoente ajustado é b = <b>'
          + M.fmt(p[1], 4) + ' ± ' + M.fmt(erros[1], 4) + '</b>. A teoria do pêndulo prevê '
          + 'exatamente <b>0,5</b>, e o valor obtido dista '
          + M.fmt(Math.abs(p[1] - 0.5) / erros[1], 1) + 'σ disso. '
          + 'Com A = 2π/√g, vem g = (2π/A)² = <b>'
          + M.fmt(Math.pow(2 * Math.PI / p[0], 2), 3) + ' m/s²</b>.';
      } else {
        txt += '<br><br><b>Resultado físico.</b> O pico está em μ = <b>' + M.fmt(p[1], 3)
          + ' ± ' + M.fmt(erros[1], 3) + '</b> e tem largura σ = <b>' + M.fmt(p[2], 3)
          + ' ± ' + M.fmt(erros[2], 3) + '</b>, sobre um fundo constante C = '
          + M.fmt(p[3], 2) + '. A largura a meia altura é 2,355σ = '
          + M.fmt(2.355 * p[2], 2) + ' canais: a resolução do detector.'
          + '<br><i>Este modelo não tem linearização possível:</i> não há transformação que '
          + 'o torne linear nos quatro parâmetros. O ajuste iterativo é a única saída.';
      }

      saida.innerHTML = txt;
      if (window.MathJax && window.MathJax.typesetPromise)
        window.MathJax.typesetPromise([saida]).catch(function () {});
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Propagação de erros: fórmula contra Monte Carlo
     ================================================================= */
  var FORMULAS = {
    soma:  { rot: 'z = x + y', f: function (x, y) { return x + y; },
             dx: function () { return 1; }, dy: function () { return 1; },
             lei: 'Soma: as incertezas <b>absolutas</b> se compõem em quadratura.',
             expr: '\\sigma_z = \\sqrt{\\sigma_x^2+\\sigma_y^2}' },
    sub:   { rot: 'z = x − y', f: function (x, y) { return x - y; },
             dx: function () { return 1; }, dy: function () { return -1; },
             lei: 'Subtração: <b>a mesma</b> fórmula da soma: as incertezas somam, '
                + 'nunca se cancelam.',
             expr: '\\sigma_z = \\sqrt{\\sigma_x^2+\\sigma_y^2}' },
    prod:  { rot: 'z = x · y', f: function (x, y) { return x * y; },
             dx: function (x, y) { return y; }, dy: function (x) { return x; },
             lei: 'Produto: as incertezas <b>relativas</b> se compõem em quadratura.',
             expr: '\\frac{\\sigma_z}{|z|} = \\sqrt{\\left(\\frac{\\sigma_x}{x}\\right)^2'
                 + '+\\left(\\frac{\\sigma_y}{y}\\right)^2}' },
    div:   { rot: 'z = x / y', f: function (x, y) { return x / y; },
             dx: function (x, y) { return 1 / y; },
             dy: function (x, y) { return -x / (y * y); },
             lei: 'Divisão: igual ao produto, em incertezas relativas.',
             expr: '\\frac{\\sigma_z}{|z|} = \\sqrt{\\left(\\frac{\\sigma_x}{x}\\right)^2'
                 + '+\\left(\\frac{\\sigma_y}{y}\\right)^2}' },
    pot:   { rot: 'z = x²·y', f: function (x, y) { return x * x * y; },
             dx: function (x, y) { return 2 * x * y; },
             dy: function (x) { return x * x; },
             lei: 'Potência: o expoente <b>multiplica</b> a incerteza relativa.',
             expr: '\\frac{\\sigma_z}{|z|} = \\sqrt{\\left(2\\frac{\\sigma_x}{x}\\right)^2'
                 + '+\\left(\\frac{\\sigma_y}{y}\\right)^2}' },
    raiz:  { rot: 'z = x / √y   (ex.: T = 2π√(L/g))',
             f: function (x, y) { return x / Math.sqrt(y); },
             dx: function (x, y) { return 1 / Math.sqrt(y); },
             dy: function (x, y) { return -0.5 * x / Math.pow(y, 1.5); },
             lei: 'Raiz: o expoente ½ <b>divide por dois</b> a incerteza relativa.',
             expr: '\\frac{\\sigma_z}{|z|} = \\sqrt{\\left(\\frac{\\sigma_x}{x}\\right)^2'
                 + '+\\left(\\tfrac12\\frac{\\sigma_y}{y}\\right)^2}' },
    log:   { rot: 'z = ln x  (y ignorado)', f: function (x) { return Math.log(x); },
             dx: function (x) { return 1 / x; }, dy: function () { return 0; },
             lei: 'Logaritmo: a incerteza <b>absoluta</b> de ln x é a incerteza '
                + '<b>relativa</b> de x.',
             expr: '\\sigma_z = \\frac{\\sigma_x}{x}' }
  };

  function propagacao(raiz) {
    var c = moldura(raiz, 'Propagação de erros: a fórmula e o teste de Monte Carlo');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var tipo = 'raiz';

    var campoT = el('div', { class: 'campo', style: 'flex:3 1 300px' });
    campoT.appendChild(el('label', { html: 'Operação' }));
    var selT = el('select');
    Object.keys(FORMULAS).forEach(function (k) {
      selT.appendChild(el('option', { value: k, texto: FORMULAS[k].rot }));
    });
    selT.value = 'raiz';
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () { tipo = selT.value; atualizar(); });

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    function campoNum(rot, ini, passo) {
      var cp = el('div', { class: 'campo' });
      cp.appendChild(el('label', { html: rot }));
      var inp = el('input', { type: 'number', value: ini, step: passo || 'any' });
      cp.appendChild(inp); ctr2.appendChild(cp);
      inp.addEventListener('input', atualizar);
      return inp;
    }
    var iX = campoNum('x', 6.283);
    var iSx = campoNum('σ de x', 0.02);
    var iY = campoNum('y', 9.78);
    var iSy = campoNum('σ de y', 0.05);

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda', html:
      'Histograma: 40 000 simulações sorteando x e y de suas próprias normais e calculando z '
      + 'a cada vez. Curva vinho: a Normal que a <b>fórmula</b> prevê. Se as duas coincidem, '
      + 'a aproximação linear é boa.' });
    c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'z', k: 'z' }, { rot: 'σ_z pela fórmula', k: 'sf' },
      { rot: 'σ_z por Monte Carlo', k: 'smc' }, { rot: 'incerteza relativa', k: 'rel' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var F = FORMULAS[tipo];
      var x = Number(iX.value), sx = Math.abs(Number(iSx.value));
      var y = Number(iY.value), sy = Math.abs(Number(iSy.value));
      var z = F.f(x, y);
      if (!isFinite(z)) {
        saida.innerHTML = 'Os valores escolhidos tornam a expressão indefinida.';
        painel({ z: '—', sf: '—', smc: '—', rel: '—' });
        G.preparar(cv, 290); return;
      }

      var a = F.dx(x, y), b = F.dy(x, y);
      var sForm = Math.sqrt(a * a * sx * sx + b * b * sy * sy);

      /* Monte Carlo com gerador reprodutível */
      var N = 40000, s = 12345, amostras = [], i;
      function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
      function normal() {
        var u1 = Math.max(1e-12, rnd()), u2 = rnd();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      }
      var somaZ = 0;
      for (i = 0; i < N; i++) {
        var v = F.f(x + sx * normal(), y + sy * normal());
        if (isFinite(v)) { amostras.push(v); somaZ += v; }
      }
      var mMC = somaZ / amostras.length, va = 0;
      for (i = 0; i < amostras.length; i++) va += (amostras[i] - mMC) * (amostras[i] - mMC);
      var sMC = Math.sqrt(va / (amostras.length - 1));

      painel({
        z: M.fmt(z, 5), sf: '±' + M.fmt(sForm, 5), smc: '±' + M.fmt(sMC, 5),
        rel: M.pct(Math.abs(sForm / z), 3)
      });

      /* histograma contra a normal prevista */
      var lim = 4.2 * Math.max(sForm, sMC);
      var lo = z - lim, hi = z + lim, nb = 70;
      var cont = new Array(nb).fill(0), dentro = 0;
      for (i = 0; i < amostras.length; i++) {
        var k = Math.floor((amostras[i] - lo) / (hi - lo) * nb);
        if (k >= 0 && k < nb) { cont[k]++; dentro++; }
      }
      var larg = (hi - lo) / nb;
      var barras = [], ymax = 0;
      for (i = 0; i < nb; i++) {
        var dens = cont[i] / (dentro * larg);
        barras.push({ x: lo + (i + 0.5) * larg, y: dens });
        ymax = Math.max(ymax, dens);
      }
      var curva = function (v) { return M.dNormal(v, z, sForm); };
      ymax = Math.max(ymax, curva(z)) * 1.18;

      var g = G.eixos(cv, {
        xmin: lo, xmax: hi, ymax: ymax, altura: 290,
        rotX: 'valor de z', rotY: 'densidade',
        marcasX: G.marcasLineares(lo, hi, 6, 3),
        formataY: function (v) { return M.fmt(v, 1); }
      });
      G.barras(g, barras, 'rgba(31,78,121,.42)', larg);
      G.curva(g, curva, G.COR.vinho, 2.4);
      G.vertical(g, z, '#2e7d4f', 'z');

      /* contribuições de cada variável */
      var cx = a * a * sx * sx, cy = b * b * sy * sy, tot = cx + cy;

      var txt = '<b>' + F.lei + '</b>'
        + '<br><br>A fórmula geral, para \\(z=f(x,y)\\) com x e y independentes, é'
        + '<br>\\( \\sigma_z^2=\\left(\\frac{\\partial f}{\\partial x}\\right)^2\\sigma_x^2'
        + '+\\left(\\frac{\\partial f}{\\partial y}\\right)^2\\sigma_y^2 \\)'
        + '<br>e neste caso ela se reduz a \\( ' + F.expr + ' \\).';

      txt += '<br><br><b>As derivadas aqui valem</b> ∂f/∂x = ' + M.fmt(a, 5)
        + ' e ∂f/∂y = ' + M.fmt(b, 5) + ', de modo que'
        + '<br>σ<sub>z</sub>² = (' + M.fmt(a, 4) + ')²(' + M.fmt(sx, 4) + ')² + ('
        + M.fmt(b, 4) + ')²(' + M.fmt(sy, 4) + ')² = ' + M.fmt(tot, 8)
        + ' &nbsp;⟹&nbsp; σ<sub>z</sub> = <b>' + M.fmt(sForm, 5) + '</b>.';

      txt += '<br><br><b>Quem domina a incerteza.</b> A variável x contribui com <b>'
        + M.pct(tot > 0 ? cx / tot : 0, 1) + '</b> da variância de z, e y com <b>'
        + M.pct(tot > 0 ? cy / tot : 0, 1) + '</b>. '
        + (Math.max(cx, cy) / tot > 0.8
            ? 'Uma delas domina claramente: <b>melhorar a outra é desperdício de esforço</b>. '
              + 'Como as contribuições entram ao quadrado, reduzir a maior pela metade '
              + 'rende muito mais que zerar a menor.'
            : 'As duas contribuem de forma comparável, de modo que vale a pena melhorar '
              + 'ambas.');

      var disc = Math.abs(sMC - sForm) / sForm;
      txt += '<br><br><b>Monte Carlo confere?</b> A simulação deu σ = ' + M.fmt(sMC, 5)
        + ' contra ' + M.fmt(sForm, 5) + ' da fórmula, uma diferença de '
        + M.pct(disc, 1) + '. '
        + (disc < 0.03
            ? 'Concordam, o que valida a <b>aproximação linear</b>: nesta faixa a função é '
              + 'praticamente uma reta, e a fórmula com derivadas basta.'
            : '<b>Discordam.</b> A fórmula usa só o primeiro termo da série de Taylor, e '
              + 'com incertezas grandes em relação aos valores a função deixa de ser '
              + 'aproximadamente linear. Repare que o histograma também ficou assimétrico, '
              + 'enquanto a fórmula sempre prevê uma normal simétrica.');

      txt += '<br><br><i>Experimente aumentar muito um dos σ</i> e veja o histograma '
        + 'deformar enquanto a curva vinho permanece simétrica. É o limite de validade da '
        + 'propagação por derivadas, e a razão de o Monte Carlo ser o método de referência '
        + 'quando as incertezas são grandes.';

      saida.innerHTML = txt;
      if (window.MathJax && window.MathJax.typesetPromise)
        window.MathJax.typesetPromise([saida]).catch(function () {});
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Verossimilhança: encontrar o parâmetro mais provável
     ================================================================= */
  function verossimilhanca(raiz) {
    var c = moldura(raiz, 'A função de verossimilhança e o valor mais provável');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var vista = 'lnL', sigma = 0.1;

    var campoD = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoD.appendChild(el('label', { html: 'Medidas observadas <i>(separe por ponto-e-vírgula)</i>' }));
    var iD = el('input', { type: 'text', value: '9,72; 9,85; 9,76; 9,91; 9,80' });
    campoD.appendChild(iD); ctr.appendChild(campoD);
    iD.addEventListener('input', atualizar);

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoV = el('div', { class: 'campo', style: 'flex:2 1 260px' });
    campoV.appendChild(el('label', { html: 'O que mostrar' }));
    var selV = el('select');
    [['lnL', 'ln L(μ): log-verossimilhança'],
     ['L', 'L(μ): verossimilhança'],
     ['S', 'S(μ) = Σ(xᵢ − μ)²: soma dos quadrados']].forEach(function (o) {
      selV.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoV.appendChild(selV); ctr2.appendChild(campoV);
    selV.addEventListener('change', function () { vista = selV.value; atualizar(); });

    deslizante(ctr2, 'σ suposto das medidas', 0.02, 0.5, 0.01, 0.1,
      function (v) { sigma = v; atualizar(); },
      function (v) { return v.toFixed(2).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'média aritmética x̄', k: 'm' }, { rot: 'μ que maximiza L', k: 'mu' },
      { rot: 'ln L no máximo', k: 'lnl' }, { rot: 'n', k: 'n' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    /* aceita tanto "1,5; 2,3" (vírgula decimal) quanto "1.5, 2.3" (vírgula separadora):
       se houver ponto-e-vírgula, a vírgula é decimal; senão, é separador. */
    function ler() {
      var s = String(iD.value);
      var partes = s.indexOf(';') >= 0 ? s.split(/[;\s]+/) : s.split(/[,;\s]+/);
      return partes.map(function (q) {
        return Number(q.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function atualizar() {
      var x = ler(), n = x.length, i;
      if (n < 2) {
        saida.innerHTML = 'Informe ao menos duas medidas.';
        painel({ m: '—', mu: '—', lnl: '—', n: String(n) });
        G.preparar(cv, 300); return;
      }
      var media = 0;
      for (i = 0; i < n; i++) media += x[i];
      media /= n;

      function S(mu) {
        var s = 0;
        for (var j = 0; j < n; j++) s += (x[j] - mu) * (x[j] - mu);
        return s;
      }
      function lnL(mu) {
        return -n * Math.log(sigma * Math.sqrt(2 * Math.PI)) - S(mu) / (2 * sigma * sigma);
      }
      function L(mu) { return Math.exp(lnL(mu)); }

      painel({
        m: M.fmt(media, 5), mu: M.fmt(media, 5),
        lnl: M.fmt(lnL(media), 3), n: String(n)
      });

      var lo = Math.min.apply(null, x), hi = Math.max.apply(null, x);
      var meio = (lo + hi) / 2, meia = Math.max((hi - lo) * 0.9, 4 * sigma);
      var xmin = meio - meia, xmax = meio + meia;

      var f = vista === 'S' ? S : (vista === 'L' ? L : lnL);
      var vs = [];
      for (i = 0; i <= 200; i++) vs.push(f(xmin + (xmax - xmin) * i / 200));
      var ymin = Math.min.apply(null, vs), ymax = Math.max.apply(null, vs);
      var folga = (ymax - ymin) * 0.12 || 1;

      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax,
        ymin: vista === 'L' ? 0 : ymin - folga, ymax: ymax + folga, altura: 300,
        rotX: 'valor candidato μ',
        rotY: vista === 'S' ? 'S(μ)' : (vista === 'L' ? 'L(μ)' : 'ln L(μ)'),
        marcasX: G.marcasLineares(xmin, xmax, 6, 2),
        formataY: function (v) {
          return vista === 'L' ? v.toExponential(1).replace('.', ',') : M.fmt(v, 1);
        }
      });
      var ct = g.ct;

      /* marcas das observacoes no eixo */
      for (i = 0; i < n; i++) {
        ct.strokeStyle = 'rgba(31,78,121,.55)'; ct.lineWidth = 1.6;
        ct.beginPath();
        ct.moveTo(g.X(x[i]), g.Y(g.ymin));
        ct.lineTo(g.X(x[i]), g.Y(g.ymin) - 12);
        ct.stroke();
      }

      G.curva(g, f, G.COR.vinho, 2.4);
      G.vertical(g, media, '#2e7d4f', 'x̄');
      ct.fillStyle = '#2e7d4f';
      ct.beginPath(); ct.arc(g.X(media), g.Y(f(media)), 5.5, 0, 2 * Math.PI); ct.fill();
      ct.strokeStyle = '#fff'; ct.lineWidth = 1.6; ct.stroke();

      legenda.innerHTML = 'Traços azuis no eixo: as medidas observadas. Curva vinho: a função '
        + 'em cada valor candidato de μ. Ponto verde: o extremo, que cai <b>exatamente</b> '
        + 'sobre a média aritmética.';

      var txt = '';
      if (vista === 'lnL') {
        txt = 'A <b>verossimilhança</b> responde: dado que observei estas ' + n
          + ' medidas, qual valor de μ as torna mais prováveis? Para cada candidato μ, '
          + 'multiplicamos as densidades das ' + n + ' observações:'
          + '<br><br>\\( L(\\mu)=\\prod_i \\frac{1}{\\sigma\\sqrt{2\\pi}}'
          + '\\exp\\!\\left[-\\frac{(x_i-\\mu)^2}{2\\sigma^2}\\right] \\)'
          + '<br><br>Tomando o logaritmo: que não muda onde está o máximo, por ser função '
          + 'crescente: o produto vira soma:'
          + '<br><br>\\( \\ln L(\\mu) = -n\\ln(\\sigma\\sqrt{2\\pi}) '
          + '- \\frac{1}{2\\sigma^2}\\sum_i (x_i-\\mu)^2 \\)'
          + '<br><br><b>Repare na estrutura.</b> O primeiro termo não depende de μ. '
          + 'Maximizar ln L é, portanto, <b>minimizar \\(\\sum (x_i-\\mu)^2\\)</b>, e é '
          + 'daí que os mínimos quadrados saem, como veremos no Módulo 8.';
      } else if (vista === 'L') {
        txt = 'Esta é a verossimilhança sem logaritmo. Note a escala do eixo vertical: '
          + 'com ' + n + ' medidas, L é o produto de ' + n + ' densidades e assume valores '
          + 'minúsculos. Com 50 medidas, o produto estoura a precisão de qualquer '
          + 'computador.'
          + '<br><br>É a <b>razão prática</b> de sempre se trabalhar com ln L: ele converte '
          + 'produto em soma e mantém os números em escala tratável. O máximo é o mesmo.';
      } else {
        txt = 'Esta é apenas a soma dos quadrados dos desvios, \\(S(\\mu)=\\sum_i '
          + '(x_i-\\mu)^2\\): uma parábola em μ.'
          + '<br><br>Compare com a vista de ln L: as duas têm o extremo no <b>mesmo</b> '
          + 'ponto, uma de cabeça para baixo em relação à outra. '
          + 'Não é coincidência: \\(\\ln L = \\text{const} - S/2\\sigma^2\\), de modo que '
          + '<b>maximizar a verossimilhança é literalmente minimizar os quadrados</b>, '
          + 'desde que os erros sejam normais e de mesmo σ.';
      }

      txt += '<br><br><b>A demonstração, em três linhas.</b> Derivando e igualando a zero:'
        + '<br>\\( \\frac{d}{d\\mu}\\sum_i (x_i-\\mu)^2 = -2\\sum_i (x_i-\\mu) = 0 \\)'
        + '<br>\\( \\Rightarrow \\sum_i x_i = n\\mu \\Rightarrow \\mu = \\bar x \\)'
        + '<br><br>Aqui, \\(\\bar x = ' + M.fmt(media, 5) + '\\), e é exatamente onde o '
        + 'ponto verde caiu. <b>A média aritmética é o estimador de máxima verossimilhança '
        + 'da posição</b>, quando os erros são normais, e é essa a justificativa de usá-la, '
        + 'não o costume.';

      if (vista !== 'S') {
        txt += '<br><br><i>Arraste o σ suposto:</i> a curva fica mais aguda com σ pequeno e '
          + 'mais achatada com σ grande, mas o <b>máximo não se desloca</b>. O σ controla '
          + 'a <i>confiança</i> na estimativa, não a estimativa em si, e a curvatura no '
          + 'máximo é justamente o que define a incerteza de μ.';
      }

      saida.innerHTML = txt;
      if (window.MathJax && window.MathJax.typesetPromise)
        window.MathJax.typesetPromise([saida]).catch(function () {});
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     A normal como caso limite de outras distribuições
     ================================================================= */
  function limiteNormal(raiz) {
    var c = moldura(raiz, 'A Normal como limite: binomial, Poisson e somas');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var fonte = 'binomial', par = 10, p = 0.5;

    var campoF = el('div', { class: 'campo', style: 'flex:2 1 240px' });
    campoF.appendChild(el('label', { html: 'Distribuição de partida' }));
    var selF = el('select');
    [['binomial', 'Binomial(n, p)'],
     ['poisson', 'Poisson(λ)'],
     ['uniforme', 'Soma de k uniformes'],
     ['exponencial', 'Soma de k exponenciais']].forEach(function (o) {
      selF.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoF.appendChild(selF); ctr.appendChild(campoF);
    selF.addEventListener('change', function () {
      fonte = selF.value; ajustar(); atualizar();
    });

    var desP, campoPp;
    var desPar = deslizante(ctr, 'n (ou λ, ou k)', 1, 60, 1, 10,
      function (v) { par = v; atualizar(); });
    campoPp = el('div', { class: 'campo' });
    campoPp.appendChild(el('label', { html: 'p da binomial' }));
    desP = el('input', { type: 'range', min: 0.05, max: 0.95, step: 0.05, value: 0.5 });
    campoPp.appendChild(desP); ctr.appendChild(campoPp);
    desP.addEventListener('input', function () { p = Number(desP.value); atualizar(); });

    function ajustar() { campoPp.style.display = fonte === 'binomial' ? '' : 'none'; }
    ajustar();

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda', html:
      'Barras azuis: a distribuição exata. Curva vinho: a Normal de mesma média e mesma '
      + 'variância. A aproximação melhora conforme o parâmetro cresce.' });
    c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'média μ', k: 'mu' }, { rot: 'desvio σ', k: 'sd' },
      { rot: 'assimetria γ₁', k: 'g1' }, { rot: 'erro máx. da aproximação', k: 'err' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var mu, sd, g1, discreta = true, probs = [], vals = [], i;

      if (fonte === 'binomial') {
        var n = par;
        mu = n * p; sd = Math.sqrt(n * p * (1 - p));
        g1 = (1 - 2 * p) / sd;
        for (i = 0; i <= n; i++) { vals.push(i); probs.push(M.pBinomial(n, i, p)); }
      } else if (fonte === 'poisson') {
        var lam = par;
        mu = lam; sd = Math.sqrt(lam); g1 = 1 / Math.sqrt(lam);
        var top = Math.ceil(lam + 5 * sd);
        for (i = 0; i <= top; i++) { vals.push(i); probs.push(M.pPoisson(i, lam)); }
      } else {
        discreta = false;
        var k = par;
        if (fonte === 'uniforme') { mu = k * 0.5; sd = Math.sqrt(k / 12); g1 = 0; }
        else { mu = k; sd = Math.sqrt(k); g1 = 2 / Math.sqrt(k); }
      }

      /* erro maximo da aproximacao normal, nos pontos discretos */
      var errMax = 0;
      if (discreta) {
        for (i = 0; i < vals.length; i++) {
          var aprox = M.FNormal(vals[i] + 0.5, mu, sd) - M.FNormal(vals[i] - 0.5, mu, sd);
          errMax = Math.max(errMax, Math.abs(aprox - probs[i]));
        }
      }

      painel({
        mu: M.fmt(mu, 3), sd: M.fmt(sd, 4), g1: M.fmt(g1, 4),
        err: discreta ? M.fmt(errMax, 5) : '—'
      });

      var xmin = Math.max(discreta ? -0.6 : mu - 4.2 * sd, mu - 4.2 * sd);
      var xmax = mu + 4.2 * sd;
      var dens = function (v) { return M.dNormal(v, mu, sd); };

      var ymax;
      if (discreta) ymax = Math.max.apply(null, probs) * 1.22;
      else ymax = dens(mu) * 1.22;

      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax, ymax: ymax, altura: 300,
        rotX: discreta ? 'valor' : 'soma',
        rotY: discreta ? 'probabilidade' : 'densidade',
        marcasX: discreta ? G.marcasInteiras(Math.ceil(xmin), Math.floor(xmax), 10)
                          : G.marcasLineares(xmin, xmax, 7, 1),
        formataY: function (v) { return M.fmt(v, 3); }
      });

      if (discreta) {
        var barras = [];
        for (i = 0; i < vals.length; i++)
          if (vals[i] >= xmin && vals[i] <= xmax)
            barras.push({ x: vals[i], y: probs[i] });
        G.barras(g, barras, 'rgba(31,78,121,.55)');
      }
      G.curva(g, dens, G.COR.vinho, 2.4);
      G.vertical(g, mu, '#2e7d4f', 'μ');

      var txt = '';
      if (fonte === 'binomial') {
        txt = '<b>Binomial(' + par + ', ' + M.fmt(p, 2) + ')</b> contra a Normal de mesma '
          + 'média e variância. A assimetria é γ₁ = (1−2p)/σ = <b>' + M.fmt(g1, 4) + '</b>.'
          + '<br><br>A regra prática pede <b>np ≥ 5 e n(1−p) ≥ 5</b>. Aqui np = '
          + M.fmt(par * p, 1) + ' e n(1−p) = ' + M.fmt(par * (1 - p), 1) + ', de modo que a '
          + 'aproximação ' + (par * p >= 5 && par * (1 - p) >= 5 ? '<b>é</b>' : '<b>não é</b>')
          + ' recomendada. O maior desvio ponto a ponto é ' + M.fmt(errMax, 5) + '.'
          + '<br><br><i>Experimente p = 0,05 com n pequeno:</i> a binomial fica encostada no '
          + 'zero e visivelmente assimétrica, e a Normal (que é simétrica e vai até −∞) '
          + 'erra feio. Aumente n e veja a assimetria cair com 1/√n.';
      } else if (fonte === 'poisson') {
        txt = '<b>Poisson(λ = ' + par + ')</b> contra a Normal. A assimetria é '
          + '1/√λ = <b>' + M.fmt(g1, 4) + '</b>, que vai a zero conforme λ cresce.'
          + '<br><br>A regra usual é <b>λ ≥ 20</b> para a aproximação ser confiável. '
          + 'Isso importa em contagem de radiação: com poucas contagens a Poisson é '
          + 'obrigatória; com milhares, a Normal serve e simplifica tudo.'
          + '<br><br>Note que σ = √λ: na contagem de eventos raros, a incerteza é a '
          + '<b>raiz da própria contagem</b>. Mil contagens trazem incerteza de ±32, ou '
          + 'seja, 3,2%, e para chegar a 1% é preciso contar dez mil.';
      } else if (fonte === 'uniforme') {
        txt = '<b>Soma de ' + par + ' uniformes</b> em [0,1]. A uniforme não se parece em '
          + 'nada com uma Normal: é um retângulo. Mas a <b>soma</b> de várias converge '
          + 'rapidamente.'
          + '<br><br>Com k = 2 já se obtém um triângulo; com k = 3, uma curva suave em '
          + 'três trechos de parábola; com k = 12, a diferença para a Normal é difícil de '
          + 'enxergar. É o <b>teorema central do limite</b> em ação, assunto do Módulo 6.'
          + '<br><br>Esta é a razão física de os erros de medida serem aproximadamente '
          + 'normais: eles são a <b>soma de muitas causas pequenas e independentes</b>, '
          + 'nenhuma delas necessariamente normal.';
      } else {
        txt = '<b>Soma de ' + par + ' exponenciais</b> de média 1. A exponencial é '
          + 'fortemente assimétrica (γ₁ = 2), e a convergência é mais lenta que a da '
          + 'uniforme: a assimetria da soma é 2/√k = <b>' + M.fmt(g1, 3) + '</b>.'
          + '<br><br>É a lição prática sobre o TCL: ele vale sempre, mas a <b>velocidade</b> '
          + 'de convergência depende da assimetria da distribuição de partida. Distribuições '
          + 'muito assimétricas exigem k bem maior para que a Normal sirva.';
      }

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     O alvo: exatidão contra precisão
     ================================================================= */
  function alvos(raiz) {
    var c = moldura(raiz, 'O alvo: exatidão e precisão são coisas diferentes');

    var CASOS = {
      bom:   { rot: 'Exato e preciso',   vies: 0.00, disp: 0.10,
               nota: 'O objetivo de todo experimento: sem viés e com pouca dispersão.' },
      exato: { rot: 'Exato, impreciso',  vies: 0.00, disp: 0.42,
               nota: 'Os tiros se espalham, mas em torno do centro certo. A <b>média</b> '
                   + 'acerta, e repetir medidas resolve.' },
      prec:  { rot: 'Preciso, inexato',  vies: 0.46, disp: 0.10,
               nota: 'O caso traiçoeiro: resultados lindamente agrupados, todos no lugar '
                   + 'errado. Repetir não corrige coisa alguma.' },
      ruim:  { rot: 'Inexato e impreciso', vies: 0.46, disp: 0.42,
               nota: 'O pior resultado, e o único honesto dos três ruins: o problema é '
                   + 'visível de imediato.' }
    };

    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);
    var caso = 'bom', vies = 0.0, disp = 0.10, n = 12, semente = 4;

    /* botoes dos quatro casos */
    var cxB = el('div', { class: 'campo', style: 'flex-basis:100%' });
    cxB.appendChild(el('label', { html: 'Os quatro casos clássicos' }));
    var linhaB = el('div', { class: 'botoes' });
    var botoes = {};
    Object.keys(CASOS).forEach(function (k) {
      var b = el('button', { texto: CASOS[k].rot });
      linhaB.appendChild(b); botoes[k] = b;
      b.addEventListener('click', function () {
        caso = k; vies = CASOS[k].vies; disp = CASOS[k].disp;
        desV.value = vies; desV.dispatchEvent(new Event('input'));
        desD.value = disp; desD.dispatchEvent(new Event('input'));
        caso = k;            /* o evento acima limpa o caso: repõe */
        atualizar();
      });
    });
    cxB.appendChild(linhaB); ctr.appendChild(cxB);

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var desV = deslizante(ctr2, 'Erro sistemático (viés)', 0, 0.75, 0.01, 0,
      function (v) { vies = v; caso = null; atualizar(); },
      function (v) { return v.toFixed(2).replace('.', ','); });
    var desD = deslizante(ctr2, 'Erro aleatório (dispersão)', 0.02, 0.6, 0.01, 0.10,
      function (v) { disp = v; caso = null; atualizar(); },
      function (v) { return v.toFixed(2).replace('.', ','); });
    deslizante(ctr2, 'Número de tiros', 3, 60, 1, 12,
      function (v) { n = v; atualizar(); });

    var bot = el('button', { texto: 'Nova série de tiros' });
    ctr2.appendChild(bot);
    bot.addEventListener('click', function () {
      semente = Math.floor(Math.random() * 1e6); atualizar();
    });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda', html:
      'Cada ponto azul é uma medida. O <b>centro do alvo</b> é o valor verdadeiro; a '
      + '<b>cruz dourada</b> é a média das medidas. A distância entre as duas é o '
      + '<b>erro sistemático</b>; o espalhamento dos pontos em torno da cruz é o '
      + '<b>erro aleatório</b>.' });
    c.appendChild(legenda);

    var painel = cartoes(c, [
      { rot: 'exatidão (viés)', k: 'vi' }, { rot: 'precisão (dispersão)', k: 'di' },
      { rot: 'erro padrão da média', k: 'ep' }, { rot: 'erro típico de um tiro', k: 'et' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      Object.keys(botoes).forEach(function (k) {
        botoes[k].className = (k === caso) ? 'ativo' : '';
      });

      /* gerador reprodutivel */
      var s = semente || 1;
      function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
      function nrm() {
        var u1 = Math.max(1e-9, rnd()), u2 = rnd();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      }

      /* o vies desloca na diagonal superior direita, para ficar visivel */
      var ang = -Math.PI / 5;
      var bx = vies * Math.cos(ang), by = vies * Math.sin(ang);
      var pts = [], i;
      for (i = 0; i < n; i++)
        pts.push({ x: bx + disp * nrm(), y: by + disp * nrm() });

      var mx = 0, my = 0;
      for (i = 0; i < n; i++) { mx += pts[i].x; my += pts[i].y; }
      mx /= n; my /= n;

      var somaR2 = 0, somaD2 = 0;
      for (i = 0; i < n; i++) {
        somaR2 += Math.pow(pts[i].x - mx, 2) + Math.pow(pts[i].y - my, 2);
        somaD2 += pts[i].x * pts[i].x + pts[i].y * pts[i].y;
      }
      var sd = Math.sqrt(somaR2 / (2 * (n - 1)));      /* dispersão por eixo */
      var viesObs = Math.hypot(mx, my);
      var ep = sd / Math.sqrt(n);
      var erroTipico = Math.sqrt(somaD2 / n);          /* erro quadrático médio total */

      painel({
        vi: M.fmt(viesObs, 3), di: M.fmt(sd, 3),
        ep: M.fmt(ep, 3), et: M.fmt(erroTipico, 3)
      });

      /* ---------- desenho ---------- */
      var p = G.preparar(cv, 330);
      var ct = p.ct;
      var cx = p.L / 2, cy = p.A / 2;
      var R = Math.min(p.L, p.A) / 2 - 14;
      var esc = R / 1.0;                               /* 1 unidade = raio do alvo */

      /* aneis do alvo */
      var aneis = [[1.00, '#f3f5f8'], [0.78, '#e4e9f0'], [0.56, '#d3dbe6'],
                   [0.34, '#bcc8d8'], [0.16, 'rgba(253,101,0,.30)']];
      aneis.forEach(function (a) {
        ct.beginPath(); ct.arc(cx, cy, R * a[0], 0, 2 * Math.PI);
        ct.fillStyle = a[1]; ct.fill();
        ct.strokeStyle = 'rgba(22,48,79,.18)'; ct.lineWidth = 1; ct.stroke();
      });
      /* mosca */
      ct.beginPath(); ct.arc(cx, cy, R * 0.05, 0, 2 * Math.PI);
      ct.fillStyle = G.COR.laranja || '#fd6500'; ct.fill();
      /* cruz do centro verdadeiro */
      ct.strokeStyle = 'rgba(22,48,79,.45)'; ct.lineWidth = 1;
      ct.beginPath();
      ct.moveTo(cx - R, cy); ct.lineTo(cx + R, cy);
      ct.moveTo(cx, cy - R); ct.lineTo(cx, cy + R);
      ct.stroke();

      function X(v) { return cx + v * esc; }
      function Y(v) { return cy + v * esc; }

      /* circulo de dispersao: 2 sigma em torno da media dos tiros */
      ct.beginPath(); ct.arc(X(mx), Y(my), 2 * sd * esc, 0, 2 * Math.PI);
      ct.strokeStyle = 'rgba(31,78,121,.55)'; ct.lineWidth = 1.6;
      ct.setLineDash([5, 4]); ct.stroke(); ct.setLineDash([]);

      /* seta do vies: do centro verdadeiro ate a media */
      if (viesObs * esc > 6) {
        ct.strokeStyle = '#b5831f'; ct.lineWidth = 2.2;
        ct.beginPath(); ct.moveTo(cx, cy); ct.lineTo(X(mx), Y(my)); ct.stroke();
      }

      /* os tiros */
      for (i = 0; i < n; i++) {
        ct.beginPath(); ct.arc(X(pts[i].x), Y(pts[i].y), 4.6, 0, 2 * Math.PI);
        ct.fillStyle = 'rgba(31,78,121,.78)'; ct.fill();
        ct.strokeStyle = '#fff'; ct.lineWidth = 1.3; ct.stroke();
      }

      /* cruz dourada na media */
      ct.strokeStyle = '#b5831f'; ct.lineWidth = 2.8;
      ct.beginPath();
      ct.moveTo(X(mx) - 9, Y(my)); ct.lineTo(X(mx) + 9, Y(my));
      ct.moveTo(X(mx), Y(my) - 9); ct.lineTo(X(mx), Y(my) + 9);
      ct.stroke();

      /* ---------- texto ---------- */
      var exato = viesObs < 0.12, preciso = sd < 0.20;
      var nome = exato ? (preciso ? 'exato e preciso' : 'exato, mas impreciso')
                       : (preciso ? 'preciso, mas inexato' : 'inexato e impreciso');

      var txt = 'Esta série é <b>' + nome + '</b>. '
        + 'O viés observado é ' + M.fmt(viesObs, 3)
        + ' e a dispersão é ' + M.fmt(sd, 3) + ' (em unidades do raio do alvo).';

      if (caso) txt += '<br><br>' + CASOS[caso].nota;

      txt += '<br><br><b>As duas qualidades são independentes.</b> '
        + '<i>Exatidão</i> é a distância entre a cruz dourada e o centro, e só o '
        + '<b>erro sistemático</b> a degrada. <i>Precisão</i> é o quanto os pontos se '
        + 'agrupam entre si, e só o <b>erro aleatório</b> a degrada. Dá para ter uma sem '
        + 'a outra, nas quatro combinações.';

      txt += '<br><br><b>O que repetir medidas resolve.</b> Com ' + n + ' tiros, o erro '
        + 'padrão da média é ' + M.fmt(sd, 3) + '/√' + n + ' = <b>' + M.fmt(ep, 3)
        + '</b>: a cruz dourada fica cada vez mais estável. '
        + (viesObs < 0.12
            ? 'Como não há viés aqui, ela converge para o centro verdadeiro, e a média de '
              + 'muitas medidas é tão boa quanto se queira.'
            : '<b>Mas ela converge para o lugar errado</b>, a ' + M.fmt(viesObs, 3)
              + ' do centro. Aumente o número de tiros e observe: o círculo tracejado '
              + 'encolhe, a cruz para de tremer, e a distância até a mosca <b>não muda</b>.');

      if (!exato && preciso) {
        txt += '<br><br><b>Por que este é o caso perigoso.</b> O relatório sairia com uma '
          + 'barra de erro pequena, de ±' + M.fmt(2 * ep, 3) + ', sobre um valor errado '
          + 'por ' + M.fmt(viesObs, 3) + '. Isso é '
          + M.fmt(viesObs / Math.max(ep, 1e-9), 0) + ' erros padrão de distância: o '
          + 'resultado seria declarado com alta confiança e estaria errado. '
          + '<b>A estatística dos dados não enxerga o viés</b>; só calibração, outro '
          + 'método de medida ou comparação com um padrão o revelam.';
      }

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Algarismos significativos e arredondamento
     ================================================================= */
  function algarismos(raiz) {
    var c = moldura(raiz, 'Algarismos significativos na prática');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var campoV = el('div', { class: 'campo', style: 'flex:2 1 220px' });
    campoV.appendChild(el('label', { html: 'Valor medido' }));
    var iV = el('input', { type: 'text', value: '9,8067' });
    campoV.appendChild(iV); ctr.appendChild(campoV);

    var campoU = el('div', { class: 'campo', style: 'flex:2 1 220px' });
    campoU.appendChild(el('label', { html: 'Incerteza' }));
    var iU = el('input', { type: 'text', value: '0,0423' });
    campoU.appendChild(iU); ctr.appendChild(campoU);

    var nSig = 1;
    var campoN = el('div', { class: 'campo' });
    campoN.appendChild(el('label', { html: 'Algarismos na incerteza' }));
    var selN = el('select');
    [['1', '1 (padrão)'], ['2', '2 (quando o 1º é 1 ou 2)']].forEach(function (o) {
      selN.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoN.appendChild(selN); ctr.appendChild(campoN);
    selN.addEventListener('change', function () { nSig = Number(selN.value); atualizar(); });
    iV.addEventListener('input', atualizar);
    iU.addEventListener('input', atualizar);

    var painel = cartoes(c, [
      { rot: 'resultado', k: 'res' }, { rot: 'ordem da incerteza', k: 'ordem' },
      { rot: 'algarismos significativos', k: 'sig' }, { rot: 'incerteza relativa', k: 'rel' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function num(s) { return Number(String(s).trim().replace(',', '.')); }

    /* conta algarismos significativos de uma representacao decimal */
    function contaSig(s) {
      s = String(s).trim().replace(',', '.').replace(/^[+-]/, '');
      if (!/^\d*\.?\d+$/.test(s)) return null;
      var semPonto = s.replace('.', '');
      var semZeros = semPonto.replace(/^0+/, '');
      if (semZeros === '') return 1;
      /* zeros a direita so contam se ha ponto decimal */
      if (s.indexOf('.') < 0) semZeros = semZeros.replace(/0+$/, '') || '0';
      return semZeros.length;
    }

    function atualizar() {
      var v = num(iV.value), u = Math.abs(num(iU.value));
      if (!isFinite(v) || !isFinite(u) || u <= 0) {
        saida.innerHTML = 'Informe um valor e uma incerteza positiva.';
        painel({ res: '—', ordem: '—', sig: '—', rel: '—' });
        return;
      }

      /* expoente do primeiro algarismo significativo da incerteza */
      var exp = Math.floor(Math.log10(u));
      var primeiro = Math.floor(u / Math.pow(10, exp));
      var usados = (nSig === 2 || primeiro <= 2) ? 2 : 1;
      var casa = exp - (usados - 1);              /* casa decimal de corte */
      var fator = Math.pow(10, casa);
      var uArr = Math.ceil(u / fator - 1e-9) * fator;   /* incerteza arredonda p/ cima */
      var vArr = Math.round(v / fator) * fator;
      var dec = Math.max(0, -casa);

      function fmtBR(x) { return x.toFixed(dec).replace('.', ','); }
      var res = '(' + fmtBR(vArr) + ' ± ' + fmtBR(uArr) + ')';

      painel({
        res: res,
        ordem: '10<sup>' + casa + '</sup>',
        sig: String(contaSig(vArr.toFixed(dec)) || '—'),
        rel: M.pct(uArr / Math.abs(vArr), 2)
      });

      var txt = '<b>Regra em dois passos.</b><br>'
        + '<b>1.</b> A incerteza define a precisão. Arredonde-a para <b>' + usados
        + ' algarismo' + (usados > 1 ? 's' : '') + ' significativo'
        + (usados > 1 ? 's' : '') + '</b>: ' + M.fmt(u, 6) + ' → <b>' + fmtBR(uArr)
        + '</b>'
        + (usados === 2
            ? '. Usamos dois porque o primeiro algarismo é ' + primeiro
              + ', e com 1 ou 2 arredondar para um só algarismo perderia precisão '
              + 'demais (de 1,4 para 1 é um erro de quase 30%).'
            : '.')
        + '<br><b>2.</b> O valor acompanha: arredonde-o na <b>mesma casa decimal</b> da '
        + 'incerteza. ' + M.fmt(v, 6) + ' → <b>' + fmtBR(vArr) + '</b>.';

      txt += '<br><br><b>Resultado: ' + res + '</b>'
        + (dec > 0 ? ': ambos com ' + dec + ' casa' + (dec > 1 ? 's' : '') + ' decimal'
                     + (dec > 1 ? 'is' : '') + '.' : ': ambos inteiros.');

      txt += '<br><br><b>O erro mais comum.</b> Escrever "' + v + ' ± ' + u + '" copiando '
        + 'as casas que a calculadora mostrou. Se a incerteza é ' + fmtBR(uArr)
        + ', os algarismos do valor além da casa 10<sup>' + casa + '</sup> '
        + '<i>não são conhecidos</i>: anotá-los é afirmar uma precisão que a medida não '
        + 'tem.';

      txt += '<br><br><b>Por que a incerteza arredonda para cima.</b> Arredondar '
        + 'para baixo declara uma precisão maior que a real. Na dúvida, o arredondamento '
        + 'deve sempre ser conservador: 0,0423 vira 0,05, e não 0,04.';

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Leitura de instrumentos e incerteza de leitura
     ================================================================= */
  function instrumentos(raiz) {
    var c = moldura(raiz, 'Leitura de instrumentos: de onde vem a incerteza');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var tipo = 'regua', valor = 4.37;

    var campoT = el('div', { class: 'campo', style: 'flex:2 1 260px' });
    campoT.appendChild(el('label', { html: 'Instrumento' }));
    var selT = el('select');
    [['regua', 'Régua milimetrada (divisão 1 mm)'],
     ['paquimetro', 'Paquímetro com nônio de 20 divisões'],
     ['digital', 'Instrumento digital (3 casas)']].forEach(function (o) {
      selT.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () { tipo = selT.value; atualizar(); });

    deslizante(ctr, 'Valor real da peça (cm)', 1, 9, 0.001, 4.37,
      function (v) { valor = v; atualizar(); },
      function (v) { return v.toFixed(3).replace('.', ','); });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'menor divisão', k: 'div' }, { rot: 'leitura', k: 'leit' },
      { rot: 'incerteza de leitura', k: 'inc' }, { rot: 'resultado', k: 'res' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var divisao, leitura, inc, casas;
      if (tipo === 'regua') {
        divisao = 0.1;                       /* 1 mm em cm */
        /* o operador estima a fracao: leitura ate meio milimetro */
        leitura = Math.round(valor / 0.05) * 0.05;
        inc = 0.05; casas = 2;
      } else if (tipo === 'paquimetro') {
        divisao = 0.005;                     /* 0,05 mm em cm */
        leitura = Math.round(valor / 0.005) * 0.005;
        inc = 0.005; casas = 3;
      } else {
        divisao = 0.001;
        leitura = Math.round(valor / 0.001) * 0.001;
        inc = 0.001; casas = 3;
      }
      function f(x) { return x.toFixed(casas).replace('.', ','); }

      painel({
        div: f(divisao) + ' cm', leit: f(leitura) + ' cm',
        inc: '± ' + f(inc) + ' cm',
        res: '(' + f(leitura) + ' ± ' + f(inc) + ') cm'
      });

      /* ---------- desenho da escala ---------- */
      var x0 = Math.max(0, Math.floor(valor) - 1), x1 = x0 + 3;
      var g = G.eixos(cv, {
        xmin: x0, xmax: x1, ymin: 0, ymax: 1, altura: 190,
        rotX: 'centímetros', rotY: '',
        marcasX: G.marcasLineares(x0, x1, 7, 1),
        formataY: function () { return ''; }
      });
      var ct = g.ct, i;

      /* corpo da peca medida */
      ct.fillStyle = 'rgba(31,78,121,.16)';
      ct.fillRect(g.X(x0 + 0.25), g.Y(0.92), g.X(valor) - g.X(x0 + 0.25),
                  g.Y(0.52) - g.Y(0.92));
      ct.strokeStyle = G.COR.azul; ct.lineWidth = 1.6;
      ct.strokeRect(g.X(x0 + 0.25), g.Y(0.92), g.X(valor) - g.X(x0 + 0.25),
                    g.Y(0.52) - g.Y(0.92));

      /* escala do instrumento */
      var passo = tipo === 'regua' ? 0.1 : (tipo === 'paquimetro' ? 0.005 : 0.001);
      var nTracos = Math.round((x1 - x0) / passo);
      if (nTracos <= 900) {
        for (i = 0; i <= nTracos; i++) {
          var xv = x0 + i * passo;
          var grande = Math.abs(xv / 1 - Math.round(xv / 1)) < 1e-9;
          var meio = Math.abs(xv / 0.5 - Math.round(xv / 0.5)) < 1e-9;
          var h = grande ? 0.34 : (meio ? 0.24 : 0.15);
          ct.strokeStyle = grande ? G.COR.tinta : G.COR.suave;
          ct.lineWidth = grande ? 1.6 : 0.8;
          ct.beginPath();
          ct.moveTo(g.X(xv), g.Y(0.40));
          ct.lineTo(g.X(xv), g.Y(0.40 - h));
          ct.stroke();
        }
      }
      ct.strokeStyle = G.COR.tinta; ct.lineWidth = 1.6;
      ct.beginPath(); ct.moveTo(g.X(x0), g.Y(0.40)); ct.lineTo(g.X(x1), g.Y(0.40)); ct.stroke();

      /* ponta da peca e faixa de incerteza */
      ct.fillStyle = 'rgba(140,47,57,.22)';
      ct.fillRect(g.X(leitura - inc), g.Y(1.0), g.X(leitura + inc) - g.X(leitura - inc),
                  g.Y(0) - g.Y(1.0));
      G.vertical(g, valor, '#2e7d4f', 'real');
      G.vertical(g, leitura, G.COR.vinho, 'leitura');

      legenda.innerHTML = 'Retângulo azul: a peça. Linha verde: o valor verdadeiro. '
        + 'Linha vinho: o que se consegue ler. Faixa vermelha: o intervalo de valores '
        + 'compatíveis com essa leitura.';

      /* ---------- texto ---------- */
      var txt = '';
      if (tipo === 'regua') {
        txt = '<b>Régua milimetrada.</b> A menor divisão é 1 mm = 0,1 cm. A convenção é '
          + 'que o observador <b>estima a fração</b> da última divisão, anotando um '
          + 'algarismo <i>duvidoso</i> além dos certos.'
          + '<br><br>A incerteza adotada é <b>metade da menor divisão</b>: ± 0,05 cm. '
          + 'Com isso a leitura tem três algarismos significativos: dois certos e um '
          + 'duvidoso. <b>Esse algarismo duvidoso é significativo e deve ser anotado</b>: '
          + 'descartá-lo joga fora informação real.';
      } else if (tipo === 'paquimetro') {
        txt = '<b>Paquímetro com nônio.</b> O nônio (ou vernier) divide a menor divisão da '
          + 'escala principal em 20 partes, permitindo ler diretamente 0,05 mm = 0,005 cm '
          + 'sem estimativa.'
          + '<br><br>Como a leitura é <b>direta</b>, e não estimada, a incerteza é a '
          + '<b>própria menor divisão</b>, e não metade dela: ± 0,005 cm. '
          + 'Esta é a distinção que mais confunde: <i>escala analógica com estimativa</i> '
          + 'usa metade da divisão; <i>leitura discreta sem estimativa</i> usa a divisão '
          + 'inteira.';
      } else {
        txt = '<b>Instrumento digital.</b> Não há estimativa possível: o mostrador dá um '
          + 'número e pronto. A incerteza de leitura é <b>uma unidade do último dígito</b>, '
          + '± 0,001 cm aqui.'
          + '<br><br><b>Mas atenção:</b> essa é só a incerteza de <i>leitura</i>. O manual '
          + 'do fabricante costuma especificar algo como "± (0,5% da leitura + 2 dígitos)", '
          + 'que inclui a incerteza de <b>calibração</b> e costuma ser bem maior. '
          + 'Resolução alta não é sinônimo de exatidão: um instrumento descalibrado erra '
          + 'com muitas casas decimais.';
      }
      txt += '<br><br>Nesta configuração o valor real é ' + valor.toFixed(3).replace('.', ',')
        + ' cm e a leitura possível é ' + f(leitura) + ' cm, uma diferença de '
        + Math.abs(valor - leitura).toFixed(4).replace('.', ',') + ' cm: '
        + (Math.abs(valor - leitura) <= inc
            ? 'dentro da incerteza declarada, como deve ser.'
            : 'fora da faixa, o que indicaria um problema de leitura.')
        + ' <i>Arraste o valor real</i> e veja que a leitura só muda em degraus: é a '
        + '<b>discretização</b> imposta pelo instrumento.';

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Calculadora de tamanho amostral
     ================================================================= */
  function tamanhoAmostral(raiz) {
    var c = moldura(raiz, 'Calculadora de tamanho amostral');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var cen = 'media', conf = 0.95, poder = 0.80, N = 0;

    var campoC = el('div', { class: 'campo', style: 'flex:3 1 300px' });
    campoC.appendChild(el('label', { html: 'O que você quer fazer' }));
    var selC = el('select');
    [['media', 'Estimar uma média com erro máximo E'],
     ['prop', 'Estimar uma proporção com erro máximo E'],
     ['duasmedias', 'Comparar duas médias (detectar diferença δ)'],
     ['duasprop', 'Comparar duas proporções'],
     ['corr', 'Detectar uma correlação r']].forEach(function (o) {
      selC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoC.appendChild(selC); ctr.appendChild(campoC);
    selC.addEventListener('change', function () { cen = selC.value; ajustar(); atualizar(); });

    var campoNC = el('div', { class: 'campo' });
    campoNC.appendChild(el('label', { html: 'Confiança (1 − α)' }));
    var selNC = el('select');
    [['0.90', '90%'], ['0.95', '95%'], ['0.99', '99%']].forEach(function (o) {
      selNC.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selNC.value = '0.95'; campoNC.appendChild(selNC); ctr.appendChild(campoNC);
    selNC.addEventListener('change', function () { conf = Number(selNC.value); atualizar(); });

    var campoPo = el('div', { class: 'campo' });
    campoPo.appendChild(el('label', { html: 'Poder desejado (1 − β)' }));
    var selPo = el('select');
    [['0.80', '80%'], ['0.90', '90%'], ['0.95', '95%']].forEach(function (o) {
      selPo.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selPo.value = '0.80'; campoPo.appendChild(selPo); ctr.appendChild(campoPo);
    selPo.addEventListener('change', function () { poder = Number(selPo.value); atualizar(); });

    /* campos numéricos específicos de cada cenário */
    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    function campoNum(rot, inicial, passo) {
      var cp = el('div', { class: 'campo' });
      cp.appendChild(el('label', { html: rot }));
      var inp = el('input', { type: 'number', value: inicial, step: passo || 'any' });
      cp.appendChild(inp); ctr2.appendChild(cp);
      inp.addEventListener('input', atualizar);
      return { campo: cp, inp: inp, v: function () { return Number(inp.value); } };
    }
    var fSigma = campoNum('Desvio padrão σ (estimado)', 10);
    var fE     = campoNum('Erro máximo E aceitável', 2);
    var fP     = campoNum('Proporção esperada p (0 a 1)', 0.5, '0.01');
    var fEp    = campoNum('Erro máximo E (em proporção)', 0.05, '0.01');
    var fDelta = campoNum('Diferença δ a detectar', 5);
    var fSig2  = campoNum('Desvio padrão σ comum', 10);
    var fP1    = campoNum('Proporção do grupo 1', 0.50, '0.01');
    var fP2    = campoNum('Proporção do grupo 2', 0.60, '0.01');
    var fR     = campoNum('Correlação r a detectar', 0.30, '0.01');
    var fN     = campoNum('População finita N (0 = infinita)', 0, '1');

    function ajustar() {
      var mostra = {
        media:      [fSigma, fE, fN],
        prop:       [fP, fEp, fN],
        duasmedias: [fDelta, fSig2],
        duasprop:   [fP1, fP2],
        corr:       [fR]
      }[cen];
      [fSigma, fE, fP, fEp, fDelta, fSig2, fP1, fP2, fR, fN].forEach(function (f) {
        f.campo.style.display = mostra.indexOf(f) >= 0 ? '' : 'none';
      });
      campoPo.style.display = (cen === 'media' || cen === 'prop') ? 'none' : '';
    }
    ajustar();

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'n necessário', k: 'n' }, { rot: 'por grupo / total', k: 'tot' },
      { rot: 'z usado', k: 'z' }, { rot: 'ajuste p/ população finita', k: 'fin' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    /* n em função do parâmetro que varia, para a curva */
    function calcula(par) {
      var za = M.zCritico(1 - (1 - conf) / 2);
      var zb = M.zCritico(poder);
      var n;
      if (cen === 'media') {
        n = Math.pow(za * fSigma.v() / par, 2);
      } else if (cen === 'prop') {
        var p = Math.min(0.999, Math.max(0.001, fP.v()));
        n = za * za * p * (1 - p) / (par * par);
      } else if (cen === 'duasmedias') {
        n = 2 * Math.pow(za + zb, 2) * Math.pow(fSig2.v() / par, 2);
      } else if (cen === 'duasprop') {
        var p1 = fP1.v(), p2 = p1 + par;
        p2 = Math.min(0.999, Math.max(0.001, p2));
        n = Math.pow(za + zb, 2) * (p1 * (1 - p1) + p2 * (1 - p2)) / Math.pow(p1 - p2, 2);
      } else {
        var r = Math.min(0.99, Math.max(0.01, Math.abs(par)));
        var zr = 0.5 * Math.log((1 + r) / (1 - r));
        n = Math.pow((za + zb) / zr, 2) + 3;
      }
      return n;
    }

    function atualizar() {
      var za = M.zCritico(1 - (1 - conf) / 2);
      var zb = M.zCritico(poder);
      var par = { media: fE.v(), prop: fEp.v(), duasmedias: fDelta.v(),
                  duasprop: fP2.v() - fP1.v(), corr: fR.v() }[cen];
      if (!isFinite(par) || par === 0) {
        saida.innerHTML = 'Informe um valor diferente de zero para o efeito ou erro máximo.';
        painel({ n: '—', tot: '—', z: '—', fin: '—' });
        G.preparar(cv, 290); return;
      }

      var nBruto = calcula(par);
      var n = Math.ceil(nBruto);
      var porGrupo = (cen === 'duasmedias' || cen === 'duasprop');
      var Nf = fN.v();
      var nAj = (Nf > 0 && !porGrupo) ? Math.ceil(n / (1 + (n - 1) / Nf)) : null;

      painel({
        n: String(n),
        tot: porGrupo ? (n + ' por grupo, ' + (2 * n) + ' no total') : (n + ' no total'),
        z: 'z = ' + M.fmt(za, 3) + (porGrupo || cen === 'corr'
             ? ' , z<sub>β</sub> = ' + M.fmt(zb, 3) : ''),
        fin: nAj !== null ? String(nAj) : '—'
      });

      /* ---------- curva de n contra o parâmetro ---------- */
      var rotX = { media: 'erro máximo E', prop: 'erro máximo E',
                   duasmedias: 'diferença δ a detectar',
                   duasprop: 'diferença entre as proporções',
                   corr: 'correlação r a detectar' }[cen];
      var xmin, xmax;
      if (cen === 'corr') { xmin = 0.05; xmax = 0.80; }
      else if (cen === 'prop' || cen === 'duasprop') { xmin = 0.01; xmax = 0.30; }
      else { xmin = Math.abs(par) / 4; xmax = Math.abs(par) * 3; }

      var ys = [], xs = [], i, v;
      for (i = 0; i <= 160; i++) {
        v = xmin + (xmax - xmin) * i / 160;
        xs.push(v); ys.push(calcula(cen === 'duasprop' ? v : v));
      }
      var ymax = Math.min(Math.max.apply(null, ys), calcula(xmin)) * 1.05;
      ymax = Math.min(ymax, Math.max(n * 6, 50));

      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax, ymin: 0, ymax: ymax, altura: 290,
        rotX: rotX, rotY: 'n necessário',
        marcasX: G.marcasLineares(xmin, xmax, 6, xmax <= 1 ? 2 : 1),
        formataY: function (w) { return M.fmt(w, 0); }
      });
      var ct = g.ct;
      ct.strokeStyle = G.COR.vinho; ct.lineWidth = 2.4;
      ct.beginPath();
      var comecou = false;
      for (i = 0; i < xs.length; i++) {
        if (ys[i] > ymax) { comecou = false; continue; }
        if (!comecou) { ct.moveTo(g.X(xs[i]), g.Y(ys[i])); comecou = true; }
        else ct.lineTo(g.X(xs[i]), g.Y(ys[i]));
      }
      ct.stroke();
      if (Math.abs(par) >= xmin && Math.abs(par) <= xmax && n <= ymax) {
        G.vertical(g, Math.abs(par), '#2e7d4f', '');
        ct.strokeStyle = '#2e7d4f'; ct.lineWidth = 1.4; ct.setLineDash([5, 4]);
        ct.beginPath(); ct.moveTo(g.X(g.xmin), g.Y(n)); ct.lineTo(g.X(Math.abs(par)), g.Y(n));
        ct.stroke(); ct.setLineDash([]);
        ct.fillStyle = '#2e7d4f';
        ct.beginPath(); ct.arc(g.X(Math.abs(par)), g.Y(n), 5, 0, 2 * Math.PI); ct.fill();
        ct.strokeStyle = '#fff'; ct.lineWidth = 1.5; ct.stroke();
      }
      legenda.innerHTML = 'A curva mostra como o n exigido cresce quando o efeito a detectar '
        + '(ou o erro tolerado) diminui. O ponto verde é a sua configuração atual. '
        + '<b>Repare na forma:</b> ela é uma hipérbole do tipo 1/E², e não uma reta.';

      /* ---------- texto ---------- */
      var txt = '';
      if (cen === 'media') {
        txt = 'Para estimar a média com erro máximo <b>E = ' + M.fmt(fE.v(), 3)
          + '</b> e ' + M.pct(conf, 0) + ' de confiança, supondo σ ≈ '
          + M.fmt(fSigma.v(), 3) + ':<br><br>'
          + '\\( n = (z_{\\alpha/2}\\,\\sigma / E)^2 \\) = (' + M.fmt(za, 3) + ' × '
          + M.fmt(fSigma.v(), 3) + ' / ' + M.fmt(fE.v(), 3) + ')² = '
          + M.fmt(nBruto, 2) + ' → <b>n = ' + n + '</b>.';
        txt += '<br><br>Note que <b>N não aparece</b> na fórmula: para uma população grande, '
          + 'o tamanho dela é irrelevante. Uma amostra de 1 000 pessoas é igualmente precisa '
          + 'no Crato e no Brasil inteiro. É contraintuitivo e é verdade.';
      } else if (cen === 'prop') {
        txt = 'Para estimar uma proporção com erro máximo <b>' + M.pct(fEp.v(), 1)
          + '</b> e ' + M.pct(conf, 0) + ' de confiança, supondo p ≈ ' + M.fmt(fP.v(), 2)
          + ':<br><br>\\( n = z_{\\alpha/2}^2\\,p(1-p)/E^2 \\) = ' + M.fmt(nBruto, 2)
          + ' → <b>n = ' + n + '</b>.';
        if (Math.abs(fP.v() - 0.5) > 0.001) {
          var nPior = Math.ceil(za * za * 0.25 / (fEp.v() * fEp.v()));
          txt += '<br><br>Como p é desconhecido antes da pesquisa, o usual é adotar o '
            + '<b>pior caso p = 0,5</b>, que maximiza p(1−p). Isso daria <b>n = ' + nPior
            + '</b>: ' + M.pct(nPior / n - 1, 0) + ' a mais, e é o número honesto a usar '
            + 'quando não se tem estudo piloto.';
        } else {
          txt += '<br><br>Com p = 0,5 estamos no <b>pior caso</b>: é o valor que maximiza '
            + 'p(1−p) = 0,25 e portanto exige a maior amostra. É a escolha prudente quando '
            + 'não há estudo piloto.';
        }
      } else if (cen === 'duasmedias') {
        var d = Math.abs(fDelta.v()) / fSig2.v();
        txt = 'Para detectar uma diferença de <b>δ = ' + M.fmt(fDelta.v(), 3)
          + '</b> entre duas médias, com σ ≈ ' + M.fmt(fSig2.v(), 3) + ', α = '
          + M.fmt(1 - conf, 3) + ' e poder ' + M.pct(poder, 0) + ':<br><br>'
          + '\\( n = 2(z_{\\alpha/2}+z_{\\beta})^2\\,\\sigma^2/\\delta^2 \\) = '
          + M.fmt(nBruto, 2) + ' → <b>' + n + ' por grupo</b>, ' + (2 * n) + ' no total.';
        txt += '<br><br><b>Tamanho de efeito:</b> d = δ/σ = <b>' + M.fmt(d, 3) + '</b> '
          + '(d de Cohen). Pela convenção usual, '
          + (d < 0.35 ? 'é um efeito <b>pequeno</b>, e efeitos pequenos custam caro.'
             : d < 0.65 ? 'é um efeito <b>médio</b>.'
             : 'é um efeito <b>grande</b>.')
          + ' O que importa é que n depende apenas de d: dobrar δ e dobrar σ ao mesmo tempo '
          + 'não muda nada.';
      } else if (cen === 'duasprop') {
        txt = 'Para detectar a diferença entre <b>' + M.pct(fP1.v(), 1) + '</b> e <b>'
          + M.pct(fP2.v(), 1) + '</b>, com α = ' + M.fmt(1 - conf, 3) + ' e poder '
          + M.pct(poder, 0) + ': <b>' + n + ' por grupo</b>, ' + (2 * n) + ' no total.';
        txt += '<br><br>Diferenças pequenas entre proporções são <b>caríssimas</b> de '
          + 'detectar. Experimente aproximar as duas proporções e veja o n explodir.';
      } else {
        var zr = 0.5 * Math.log((1 + Math.abs(fR.v())) / (1 - Math.abs(fR.v())));
        txt = 'Para detectar uma correlação de <b>r = ' + M.fmt(fR.v(), 2) + '</b> com α = '
          + M.fmt(1 - conf, 3) + ' e poder ' + M.pct(poder, 0)
          + ', usa-se a transformação z de Fisher, z<sub>r</sub> = ½ ln[(1+r)/(1−r)] = <b>'
          + M.fmt(zr, 4) + '</b>:<br><br>'
          + '\\( n = \\left[(z_{\\alpha/2}+z_{\\beta})/z_r\\right]^2 + 3 \\) = '
          + M.fmt(nBruto, 2) + ' → <b>n = ' + n + '</b>.';
        txt += '<br><br>Correlações fracas exigem amostras enormes. Repare na curva: para '
          + 'r = 0,10 o n passa de 780.';
      }

      if (nAj !== null) {
        txt += '<br><br><b>Correção para população finita.</b> Com N = ' + Nf
          + ', basta n<sub>aj</sub> = n/[1+(n−1)/N] = <b>' + nAj + '</b>, ou seja, '
          + M.pct(nAj / Nf, 1) + ' da população. A correção só importa quando a amostra '
          + 'passa de cerca de 5% de N.';
      }

      txt += '<br><br><b>Arredonde sempre para cima</b> e acrescente margem para perdas: '
        + 'se você espera 20% de não resposta ou de medidas inutilizadas, colete '
        + '<b>' + Math.ceil(n / 0.8) + '</b> em vez de ' + n + '.';

      saida.innerHTML = txt;
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([saida]).catch(function () {});
      }
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Curvas de poder: o que se ganha aumentando n
     ================================================================= */
  function curvasPoder(raiz) {
    var c = moldura(raiz, 'Curvas de poder: o retorno decrescente de aumentar n');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var alfa = 0.05, nAtual = 30;

    var campoA = el('div', { class: 'campo' });
    campoA.appendChild(el('label', { html: 'Nível α (bilateral)' }));
    var selA = el('select');
    [['0.10', '0,10'], ['0.05', '0,05'], ['0.01', '0,01']].forEach(function (o) {
      selA.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    selA.value = '0.05'; campoA.appendChild(selA); ctr.appendChild(campoA);
    selA.addEventListener('change', function () { alfa = Number(selA.value); atualizar(); });

    deslizante(ctr, 'n por grupo', 4, 300, 1, 30, function (v) { nAtual = v; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda', html:
      'Cada curva é um tamanho de efeito d = δ/σ. A linha tracejada marca o poder de 80%, '
      + 'convenção mais usada em planejamento. A vertical verde é o n escolhido.' });
    c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'poder se d = 0,2', k: 'p2' }, { rot: 'poder se d = 0,5', k: 'p5' },
      { rot: 'poder se d = 0,8', k: 'p8' }, { rot: 'n para 80% com d = 0,5', k: 'n80' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function poderDe(d, n) {
      var za = M.zCritico(1 - alfa / 2);
      var lam = d * Math.sqrt(n / 2);
      return M.FNormal(lam - za, 0, 1) + M.FNormal(-lam - za, 0, 1);
    }

    function atualizar() {
      var ds = [[0.2, '#b5831f', 'd = 0,2 (pequeno)'],
                [0.5, G.COR.azul, 'd = 0,5 (médio)'],
                [0.8, G.COR.vinho, 'd = 0,8 (grande)']];
      var g = G.eixos(cv, {
        xmin: 4, xmax: 300, ymin: 0, ymax: 1.04, altura: 300, divY: 5,
        rotX: 'n por grupo', rotY: 'poder (1 − β)',
        marcasX: G.marcasLineares(4, 300, 6, 0),
        formataY: function (v) { return (100 * v).toFixed(0) + '%'; }
      });
      var ct = g.ct;

      /* linha dos 80% */
      ct.strokeStyle = G.COR.suave; ct.lineWidth = 1.4; ct.setLineDash([6, 4]);
      ct.beginPath(); ct.moveTo(g.X(4), g.Y(0.8)); ct.lineTo(g.X(300), g.Y(0.8)); ct.stroke();
      ct.setLineDash([]);
      ct.fillStyle = G.COR.suave; ct.font = '600 11px var(--fonte)';
      ct.textAlign = 'left'; ct.textBaseline = 'bottom';
      ct.fillText('80%', g.X(6), g.Y(0.8) - 3);

      ds.forEach(function (par) {
        G.curva(g, function (n) { return poderDe(par[0], n); }, par[1], 2.4);
      });
      G.vertical(g, nAtual, '#2e7d4f', 'n = ' + nAtual);
      G.legenda(g, ds.map(function (p) { return { texto: p[2], cor: p[1] }; }));

      var p2 = poderDe(0.2, nAtual), p5 = poderDe(0.5, nAtual), p8 = poderDe(0.8, nAtual);
      var za = M.zCritico(1 - alfa / 2), zb = M.zCritico(0.8);
      var n80 = Math.ceil(2 * Math.pow(za + zb, 2) / 0.25);
      painel({ p2: M.pct(p2, 1), p5: M.pct(p5, 1), p8: M.pct(p8, 1), n80: String(n80) });

      var dobro = poderDe(0.5, 2 * nAtual);
      var txt = 'Com <b>n = ' + nAtual + '</b> por grupo e α = ' + M.fmt(alfa, 2)
        + ', o poder é <b>' + M.pct(p2, 1) + '</b> para um efeito pequeno, <b>'
        + M.pct(p5, 1) + '</b> para um médio e <b>' + M.pct(p8, 1) + '</b> para um grande.';
      var ganho = 100 * (dobro - p5);
      txt += '<br><br><b>O retorno é decrescente.</b> Dobrando n para ' + (2 * nAtual)
        + ', o poder contra d = 0,5 iria de ' + M.pct(p5, 1) + ' para '
        + M.pct(dobro, 1) + ': um ganho de ' + M.fmt(ganho, 1) + ' pontos. '
        + (ganho > 15
            ? 'Aqui ainda compensa, porque estamos na parte íngreme da curva. '
              + 'Arraste o n para cima e refaça a conta: o mesmo esforço rende cada vez '
              + 'menos.'
            : 'Pouquíssimo, porque a curva já achatou: perto do teto, dobrar a amostra '
              + 'quase não muda nada. É por isso que ninguém planeja para 99% de poder.');
      txt += '<br><br><b>Por que 80%?</b> É convenção, não lei. Ela embute a ideia de que '
        + 'um erro tipo I é cerca de quatro vezes mais grave que um tipo II '
        + '(β = 0,20 = 4α). Se deixar de detectar um efeito real for mais caro que um '
        + 'alarme falso (num teste de segurança, por exemplo) planeje para 90% ou 95%.';
      txt += '<br><br><b>E o que não adianta.</b> Repare que para d = 0,2 é preciso passar '
        + 'de ' + Math.ceil(2 * Math.pow(za + zb, 2) / 0.04) + ' por grupo para chegar aos '
        + '80%. Estudos pequenos simplesmente <b>não conseguem</b> detectar efeitos '
        + 'pequenos, e quando um estudo pequeno encontra um efeito pequeno '
        + 'significativo, isso costuma ser acaso, não descoberta.';

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Coeficientes a_i do Shapiro–Wilk, vistos de perto
     ================================================================= */
  function coefSW(raiz) {
    var c = moldura(raiz, 'Os coeficientes aᵢ do Shapiro–Wilk');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var n = 11, vista = 'a';
    deslizante(ctr, 'Tamanho da amostra n', 4, 60, 1, 11, function (v) { n = v; atualizar(); });

    var campoV = el('div', { class: 'campo', style: 'flex:2 1 240px' });
    campoV.appendChild(el('label', { html: 'O que mostrar' }));
    var selV = el('select');
    [['a', 'Coeficientes aᵢ'],
     ['m', 'Valores esperados mᵢ das estatísticas de ordem'],
     ['comp', 'aᵢ e mᵢ sobrepostos']].forEach(function (o) {
      selV.appendChild(el('option', { value: o[0], texto: o[1] }));
    });
    campoV.appendChild(selV); ctr.appendChild(campoV);
    selV.addEventListener('change', function () { vista = selV.value; atualizar(); });

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'a₁ = −aₙ', k: 'a1' }, { rot: 'Σ aᵢ', k: 'soma' },
      { rot: 'Σ aᵢ²', k: 'soma2' }, { rot: 'peso dos 2 extremos', k: 'ext' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function atualizar() {
      var C = M.coefsSW(n);
      if (!C) { saida.innerHTML = 'Shapiro–Wilk exige 4 ≤ n ≤ 5000.'; return; }
      var a = C.a, m = C.m, i;
      var soma = 0, soma2 = 0;
      for (i = 0; i < n; i++) { soma += a[i]; soma2 += a[i] * a[i]; }
      var ext = (a[0] * a[0] + a[n - 1] * a[n - 1]) / soma2;

      painel({
        a1: M.fmt(a[n - 1], 4), soma: M.fmt(soma, 6),
        soma2: M.fmt(soma2, 6), ext: M.pct(ext, 1)
      });

      /* escala comum quando sobrepostos */
      var serie = vista === 'm' ? m : a;
      var lim = Math.max.apply(null, serie.map(Math.abs));
      if (vista === 'comp') lim = Math.max(lim, Math.max.apply(null, m.map(Math.abs)));
      lim *= 1.2;

      var g = G.eixos(cv, {
        xmin: 0.3, xmax: n + 0.7, ymin: -lim, ymax: lim, altura: 300, divY: 4,
        rotX: 'posição i na amostra ordenada',
        rotY: vista === 'm' ? 'mᵢ' : (vista === 'comp' ? 'aᵢ  e  mᵢ' : 'coeficiente aᵢ'),
        marcasX: G.marcasInteiras(1, n, 12),
        formataY: function (v) { return M.fmt(v, 2); }
      });
      var ct = g.ct;

      /* eixo zero */
      ct.strokeStyle = G.COR.suave; ct.lineWidth = 1.4;
      ct.beginPath(); ct.moveTo(g.X(g.xmin), g.Y(0)); ct.lineTo(g.X(g.xmax), g.Y(0)); ct.stroke();

      function hastes(v, cor, desloc, raio) {
        for (var i2 = 0; i2 < n; i2++) {
          var px = g.X(i2 + 1) + (desloc || 0);
          ct.strokeStyle = cor; ct.lineWidth = 1.4;
          ct.beginPath(); ct.moveTo(px, g.Y(0)); ct.lineTo(px, g.Y(v[i2])); ct.stroke();
          ct.fillStyle = cor;
          ct.beginPath(); ct.arc(px, g.Y(v[i2]), raio || 3.8, 0, 2 * Math.PI); ct.fill();
        }
      }

      if (vista === 'a') { hastes(a, G.COR.azul); }
      else if (vista === 'm') { hastes(m, '#b5831f'); }
      else {
        hastes(m, '#b5831f', -2.5, 3.2);
        hastes(a, G.COR.azul, 2.5, 3.2);
        G.legenda(g, [
          { texto: 'mᵢ (esperado da normal)', cor: '#b5831f' },
          { texto: 'aᵢ (coeficiente do teste)', cor: G.COR.azul }
        ]);
      }

      legenda.innerHTML = vista === 'm'
        ? 'mᵢ é o valor que a <i>i</i>-ésima menor observação de uma amostra normal padrão de '
          + 'tamanho n teria, em média. É o mesmo eixo horizontal do gráfico Q–Q.'
        : (vista === 'comp'
          ? 'Os aᵢ são praticamente os mᵢ reescalados: a correção de Royston só altera '
            + 'sensivelmente os dois valores de cada ponta.'
          : 'Cada haste é o peso que a <i>i</i>-ésima menor observação recebe no numerador de W.');

      var txt = 'Com n = <b>' + n + '</b>, o numerador de W é a combinação linear '
        + '∑ aᵢ x₍ᵢ₎ dos dados <b>ordenados</b>. Três propriedades aparecem no gráfico '
        + 'e valem para qualquer n:';
      txt += '<br><br><b>1. São antissimétricos:</b> aᵢ = −a₍ₙ₊₁₋ᵢ₎, e por isso ∑ aᵢ = '
        + M.fmt(soma, 6) + ' ≈ 0. A consequência é importante: somar uma constante a todos '
        + 'os dados não muda o numerador, de modo que W <b>não depende da média</b>.';
      txt += '<br><br><b>2. Estão normalizados:</b> ∑ aᵢ² = ' + M.fmt(soma2, 6)
        + ' = 1. Junto com o denominador ∑(xᵢ − x̄)², isso é o que mantém W entre 0 e 1 '
        + 'e o torna <b>invariante de escala</b>: medir em metros ou em centímetros dá o '
        + 'mesmo W.';
      txt += '<br><br><b>3. Os extremos mandam.</b> Os dois pontos das pontas sozinhos '
        + 'respondem por <b>' + M.pct(ext, 1) + '</b> de ∑ aᵢ², com a₁ = '
        + M.fmt(a[0], 4) + ' e aₙ = ' + M.fmt(a[n - 1], 4)
        + ', enquanto os do meio quase não pesam (o central é exatamente zero quando n é '
        + 'ímpar). É daí que vem a sensibilidade do teste às <b>caudas</b>: que é onde a '
        + 'não normalidade costuma morar.';
      txt += '<br><br><i>Arraste o n e veja o que acontece:</i> à medida que a amostra '
        + 'cresce, as hastes se achatam e o peso se distribui, porque há mais observações '
        + 'para repartir o mesmo total de 1.';

      saida.innerHTML = txt;
    }

    registrarRedesenho(atualizar);
  }

  /* =================================================================
     A escada do Kolmogorov–Smirnov
     ================================================================= */
  function escadaKS(raiz) {
    var c = moldura(raiz, 'A escada do Kolmogorov–Smirnov');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var campoD = el('div', { class: 'campo', style: 'flex:2 1 240px' });
    campoD.appendChild(el('label', { html: 'Conjunto de dados' }));
    var selD = el('select');
    Object.keys(CONJUNTOS_QQ).forEach(function (k) {
      selD.appendChild(el('option', { value: k, texto: CONJUNTOS_QQ[k].rot }));
    });
    campoD.appendChild(selD); ctr.appendChild(campoD);

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoX = el('div', { class: 'campo', style: 'flex-basis:100%' });
    campoX.appendChild(el('label', { html: 'valores' }));
    var iX = el('input', { type: 'text' }); campoX.appendChild(iX); ctr2.appendChild(campoX);
    selD.addEventListener('change', function () {
      iX.value = CONJUNTOS_QQ[selD.value].dados.trim().split(/\s+/).join(', ');
      atualizar();
    });
    iX.addEventListener('input', atualizar);

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda', html:
      'Escada azul: acumulada empírica Fₙ(x), que sobe 1/n a cada observação. '
      + 'Curva vinho: acumulada normal F(x) com a média e o desvio estimados dos dados. '
      + 'Segmento verde: onde a distância entre as duas é máxima: esse é D.' });
    c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'D', k: 'D' }, { rot: 'ocorre em x =', k: 'x' },
      { rot: 'crítico 5% (Lilliefors)', k: 'c' }, { rot: 'n', k: 'n' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function atualizar() {
      var x = ler(iX.value);
      var n = x.length;
      if (n < 4) {
        saida.innerHTML = 'Informe ao menos quatro valores.';
        painel({ D: '—', x: '—', c: '—', n: String(n) });
        G.preparar(cv, 320); return;
      }
      var ord = x.slice().sort(function (p, q) { return p - q; });
      var media = 0, i;
      for (i = 0; i < n; i++) media += ord[i];
      media /= n;
      var s2 = 0;
      for (i = 0; i < n; i++) s2 += (ord[i] - media) * (ord[i] - media);
      var s = Math.sqrt(s2 / (n - 1));

      /* D e onde ele ocorre, olhando os dois lados de cada degrau */
      var D = 0, xD = ord[0], Fteo = 0, Femp = 0, acima = true;
      for (i = 0; i < n; i++) {
        var F = M.FNormal(ord[i], media, s);
        var dMais = (i + 1) / n - F;     /* logo depois do degrau */
        var dMenos = F - i / n;          /* logo antes do degrau  */
        if (dMais > D) { D = dMais; xD = ord[i]; Fteo = F; Femp = (i + 1) / n; acima = true; }
        if (dMenos > D) { D = dMenos; xD = ord[i]; Fteo = F; Femp = i / n; acima = false; }
      }

      var L = M.lilliefors(x);
      painel({
        D: M.fmt(D, 4), x: M.fmt(xD, 3),
        c: L ? M.fmt(L.crit05, 4) : '—', n: String(n)
      });

      /* ---------- desenho ---------- */
      var xmin = Math.min(ord[0], media - 3.2 * s), xmax = Math.max(ord[n - 1], media + 3.2 * s);
      var marg = (xmax - xmin) * 0.04;
      xmin -= marg; xmax += marg;
      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax, ymin: -0.04, ymax: 1.08, altura: 330, divY: 4,
        rotX: 'x', rotY: 'probabilidade acumulada',
        marcasX: G.marcasLineares(xmin, xmax, 6, Math.abs(xmax - xmin) > 40 ? 0 : 1),
        formataY: function (v) { return M.fmt(v, 2); }
      });
      var ct = g.ct;

      /* curva teórica */
      G.curva(g, function (v) { return M.FNormal(v, media, s); }, G.COR.vinho, 2.2);

      /* escada empírica */
      ct.strokeStyle = G.COR.azul; ct.lineWidth = 2;
      ct.beginPath();
      ct.moveTo(g.X(xmin), g.Y(0));
      for (i = 0; i < n; i++) {
        ct.lineTo(g.X(ord[i]), g.Y(i / n));
        ct.lineTo(g.X(ord[i]), g.Y((i + 1) / n));
      }
      ct.lineTo(g.X(xmax), g.Y(1));
      ct.stroke();

      /* bolinhas nos degraus */
      for (i = 0; i < n; i++) {
        ct.fillStyle = G.COR.azul;
        ct.beginPath(); ct.arc(g.X(ord[i]), g.Y((i + 1) / n), 2.6, 0, 2 * Math.PI); ct.fill();
      }

      /* segmento de D */
      var px = g.X(xD);
      ct.strokeStyle = '#2e7d4f'; ct.lineWidth = 3;
      ct.beginPath(); ct.moveTo(px, g.Y(Femp)); ct.lineTo(px, g.Y(Fteo)); ct.stroke();
      [Femp, Fteo].forEach(function (v) {
        ct.beginPath(); ct.moveTo(px - 5, g.Y(v)); ct.lineTo(px + 5, g.Y(v)); ct.stroke();
      });
      ct.fillStyle = '#2e7d4f';
      ct.font = '600 12px var(--fonte)';
      ct.textAlign = 'left'; ct.textBaseline = 'middle';
      ct.fillText('D = ' + D.toFixed(3).replace('.', ','), px + 9,
                  (g.Y(Femp) + g.Y(Fteo)) / 2);

      G.legenda(g, [
        { texto: 'Fₙ(x) empírica', cor: G.COR.azul },
        { texto: 'F(x) normal ajustada', cor: G.COR.vinho }
      ]);

      /* ---------- texto ---------- */
      var txt = 'A amostra tem n = <b>' + n + '</b>, média <b>' + M.fmt(media, 3)
        + '</b> e desvio <b>' + M.fmt(s, 3) + '</b>. A escada sobe <b>1/' + n + ' = '
        + M.fmt(1 / n, 4) + '</b> em cada observação.';
      txt += '<br><br>A maior distância vertical entre a escada e a curva é <b>D = '
        + M.fmt(D, 4) + '</b>, e ocorre em x = <b>' + M.fmt(xD, 3) + '</b>, '
        + (acima ? 'logo <b>acima</b> do degrau (a empírica está à frente da teórica)'
                 : 'logo <b>abaixo</b> do degrau (a empírica está atrás da teórica)') + '.';
      txt += '<br><br><b>Por que olhar os dois lados do degrau.</b> A escada é '
        + 'descontínua: em cada observação ela salta de i/n para (i+1)/n. A distância '
        + 'máxima pode estar imediatamente antes ou imediatamente depois do salto, e um '
        + 'programa que testar só um dos lados <b>subestima D</b>. É um erro comum em '
        + 'implementações caseiras.';
      if (L) {
        txt += '<br><br>Valor crítico de <b>Lilliefors</b> a 5%: <b>' + M.fmt(L.crit05, 4)
          + '</b>. Como D = ' + M.fmt(D, 4) + (L.rejeita ? ' &gt; ' : ' &lt; ')
          + M.fmt(L.crit05, 4) + ', <b>'
          + (L.rejeita ? 'rejeitamos' : 'não rejeitamos') + ' a normalidade</b>.';
      }
      txt += '<br><br><i>Onde o KS enxerga e onde ele é cego.</i> A diferença Fₙ(x) − F(x) '
        + 'tem variância F(x)[1−F(x)]/n, que é máxima no <b>centro</b> da distribuição e '
        + 'tende a <b>zero nas caudas extremas</b>. O KS, portanto, quase não percebe o que '
        + 'acontece nos extremos: justamente onde a não normalidade mais costuma se '
        + 'manifestar. O Anderson–Darling corrige isso dividindo pelo mesmo fator, o que '
        + 'amplifica as caudas; compare os dois trocando de conjunto aqui e no simulador da '
        + 'seção 3.';

      saida.innerHTML = txt;
    }

    iX.value = CONJUNTOS_QQ.renda.dados.trim().split(/\s+/).join(', ');
    selD.value = 'renda';
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Testes não paramétricos
     ================================================================= */
  var NP = {
    sinais: {
      rot: 'Teste dos sinais (pareado)',
      rA: 'antes', rB: 'depois',
      A: [20.0, 21.5, 19.8, 22.3, 20.7, 21.0, 19.5, 22.8, 20.2, 21.8],
      B: [22.4, 23.4, 22.6, 24.5, 23.3, 20.8, 21.6, 22.5, 22.7, 21.7]
    },
    wilcoxon: {
      rot: 'Wilcoxon dos postos sinalizados (pareado)',
      rA: 'antes', rB: 'depois',
      A: [20.0, 21.5, 19.8, 22.3, 20.7, 21.0, 19.5, 22.8, 20.2, 21.8],
      B: [22.4, 23.4, 22.6, 24.5, 23.3, 20.8, 21.6, 22.5, 22.7, 21.7]
    },
    mw: {
      rot: 'Mann–Whitney (dois grupos independentes)',
      rA: 'grupo 1', rB: 'grupo 2',
      A: [12, 14, 13, 15, 11, 16, 14, 13, 120],
      B: [22, 25, 21, 27, 24, 23, 26, 22, 28]
    },
    seq: {
      rot: 'Sequências: a amostra é aleatória?',
      rA: 'série de valores', rB: '(não usado)',
      A: [12, 14, 13, 15, 16, 18, 17, 19, 21, 20, 22, 24, 23, 25, 11, 10, 9, 8, 7, 6],
      B: []
    }
  };

  function naoParametrico(raiz) {
    var c = moldura(raiz, 'Laboratório dos testes não paramétricos');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var tipo = 'sinais';

    var campoT = el('div', { class: 'campo', style: 'flex:3 1 280px' });
    campoT.appendChild(el('label', { html: 'Teste' }));
    var selT = el('select');
    Object.keys(NP).forEach(function (k) {
      selT.appendChild(el('option', { value: k, texto: NP[k].rot }));
    });
    campoT.appendChild(selT); ctr.appendChild(campoT);
    selT.addEventListener('change', function () {
      tipo = selT.value;
      iA.value = NP[tipo].A.join(', ');
      iB.value = NP[tipo].B.join(', ');
      rotA.innerHTML = NP[tipo].rA;
      rotB.innerHTML = NP[tipo].rB;
      campoB.style.display = tipo === 'seq' ? 'none' : '';
      atualizar();
    });

    var ctr2 = el('div', { class: 'controles' }); c.appendChild(ctr2);
    var campoA = el('div', { class: 'campo', style: 'flex-basis:100%' });
    var rotA = el('label', { html: 'antes' }); campoA.appendChild(rotA);
    var iA = el('input', { type: 'text' }); campoA.appendChild(iA); ctr2.appendChild(campoA);
    var campoB = el('div', { class: 'campo', style: 'flex-basis:100%' });
    var rotB = el('label', { html: 'depois' }); campoB.appendChild(rotB);
    var iB = el('input', { type: 'text' }); campoB.appendChild(iB); ctr2.appendChild(campoB);
    iA.addEventListener('input', atualizar);
    iB.addEventListener('input', atualizar);

    var cv = el('canvas'); c.appendChild(cv);
    var legenda = el('div', { class: 'legenda' }); c.appendChild(legenda);
    var painel = cartoes(c, [
      { rot: 'estatística', k: 'est' }, { rot: 'n efetivo', k: 'n' },
      { rot: 'valor p (não paramétrico)', k: 'p' },
      { rot: 'valor p (teste paramétrico)', k: 'pt' }
    ]);
    var tabela = el('div', { class: 'tabela-rolavel' }); c.appendChild(tabela);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function ler(s) {
      return String(s).split(/[,;\s]+/).map(function (t) {
        return Number(t.trim().replace(',', '.'));
      }).filter(function (v) { return isFinite(v); });
    }

    function medias(v) {
      var m = v.reduce(function (s, a) { return s + a; }, 0) / v.length;
      var s2 = v.reduce(function (s, a) { return s + (a - m) * (a - m); }, 0) / (v.length - 1);
      return { m: m, s: Math.sqrt(s2) };
    }

    function mediana(v) {
      var w = v.slice().sort(function (p, q) { return p - q; }), n = w.length;
      return n % 2 ? w[(n - 1) / 2] : (w[n / 2 - 1] + w[n / 2]) / 2;
    }

    /* ---------- desenho da distribuição nula exata ---------- */
    function nulaBarras(valores, probs, obs, critInf, critSup, rotX) {
      var ymax = Math.max.apply(null, probs) * 1.25;
      var g = G.eixos(cv, {
        xmin: valores[0] - 0.8, xmax: valores[valores.length - 1] + 0.8,
        ymax: ymax, altura: 280, rotX: rotX, rotY: 'probabilidade sob H₀',
        marcasX: G.marcasInteiras(valores[0], valores[valores.length - 1], 10),
        formataY: function (v) { return (100 * v).toFixed(1).replace('.', ',') + '%'; }
      });
      var dentro = [], fora = [];
      valores.forEach(function (v, i) {
        ((critInf !== null && v <= critInf) || (critSup !== null && v >= critSup)
          ? fora : dentro).push({ x: v, y: probs[i] });
      });
      G.barras(g, dentro, 'rgba(31,78,121,.70)');
      G.barras(g, fora, 'rgba(140,47,57,.80)');
      if (obs !== null && isFinite(obs)) G.vertical(g, obs, '#2e7d4f', 'obs');
      G.legenda(g, [
        { texto: 'não rejeição', cor: 'rgba(31,78,121,.70)' },
        { texto: 'região crítica (5%)', cor: 'rgba(140,47,57,.80)' }
      ]);
    }

    function nulaNormal(media, dp, obs, rotX) {
      var lim = 3.6 * dp;
      var f = function (v) { return M.dNormal(v, media, dp); };
      var ci = media - 1.96 * dp, cs = media + 1.96 * dp;
      var g = G.eixos(cv, {
        xmin: media - lim, xmax: media + lim, ymax: f(media) * 1.25, altura: 280,
        rotX: rotX, rotY: 'densidade sob H₀',
        marcasX: G.marcasLineares(media - lim, media + lim, 7, 0),
        formataY: function (v) { return M.fmt(v, 3); }
      });
      G.area(g, f, media - lim, ci, 'rgba(140,47,57,.28)');
      G.area(g, f, cs, media + lim, 'rgba(140,47,57,.28)');
      G.area(g, f, ci, cs, 'rgba(31,78,121,.16)');
      G.curva(g, f, G.COR.vinho, 2.2);
      G.vertical(g, ci, G.COR.vinho, M.fmt(ci, 1));
      G.vertical(g, cs, G.COR.vinho, M.fmt(cs, 1));
      if (obs !== null && isFinite(obs)) G.vertical(g, obs, '#2e7d4f', 'obs');
    }

    /* ---------- os quatro testes ---------- */
    function fazerSinais(A, B) {
      var n = Math.min(A.length, B.length), d = [], i;
      for (i = 0; i < n; i++) d.push(B[i] - A[i]);
      var pos = 0, neg = 0, zero = 0;
      d.forEach(function (v) { if (v > 0) pos++; else if (v < 0) neg++; else zero++; });
      var ne = pos + neg, k = Math.min(pos, neg);
      var p = 0;
      for (i = 0; i <= k; i++) p += M.pBinomial(ne, i, 0.5);
      p = Math.min(1, 2 * p);

      /* distribuição nula: Binomial(ne, 1/2) sobre o menor dos dois */
      var vals = [], probs = [];
      for (i = 0; i <= ne; i++) { vals.push(i); probs.push(M.pBinomial(ne, i, 0.5)); }
      /* região crítica bilateral a 5% */
      var acum = 0, cinf = -1;
      for (i = 0; i <= ne; i++) { acum += probs[i]; if (acum > 0.025) break; cinf = i; }
      var csup = cinf >= 0 ? ne - cinf : null;
      nulaBarras(vals, probs, pos, cinf >= 0 ? cinf : null, csup,
                 'número de diferenças positivas');
      legenda.innerHTML = 'Sob H₀ cada diferença tem a mesma chance de ser positiva ou '
        + 'negativa, de modo que o número de positivas segue uma <b>Binomial(n, ½)</b>. '
        + 'A linha verde marca o valor observado.';

      var par = M.momentos ? null : null;
      var dd = medias(d);
      var tt = dd.m / (dd.s / Math.sqrt(n));
      var pt = 2 * (1 - M.FT(Math.abs(tt), n - 1));

      return { est: pos + ' positivas, ' + neg + ' negativas', n: ne, p: p, pt: pt,
               d: d, zero: zero, tt: tt, nome: 'teste t pareado',
               corpo: tabelaPares(A, B, d, null) };
    }

    function fazerWilcoxon(A, B) {
      var n = Math.min(A.length, B.length), d = [], i;
      for (i = 0; i < n; i++) d.push(B[i] - A[i]);
      var naoNulos = d.filter(function (v) { return v !== 0; });
      var ne = naoNulos.length;
      var abs = naoNulos.map(Math.abs);
      var P = M.postosMedios(abs);
      var Wmais = 0, Wmenos = 0;
      naoNulos.forEach(function (v, i2) {
        if (v > 0) Wmais += P.r[i2]; else Wmenos += P.r[i2];
      });
      var W = Math.min(Wmais, Wmenos);
      var p = M.pWilcoxon(Wmais, ne, P.correcao);

      /* distribuição nula exata de W⁺ quando possível */
      if (ne <= 25 && !P.correcao) {
        var max = ne * (ne + 1) / 2, vals = [], probs = [], tot = Math.pow(2, ne);
        var acumF = [];
        for (i = 0; i <= max; i++) {
          vals.push(i);
          probs.push((M.FWilcoxon(i, ne) - (i ? M.FWilcoxon(i - 1, ne) : 0)));
        }
        var ac = 0, cinf = -1;
        for (i = 0; i <= max; i++) { ac += probs[i]; if (ac > 0.025) break; cinf = i; }
        nulaBarras(vals, probs, Wmais, cinf >= 0 ? cinf : null,
                   cinf >= 0 ? max - cinf : null, 'W⁺ (soma dos postos positivos)');
        legenda.innerHTML = 'Distribuição <b>exata</b> de W⁺ sob H₀: todas as '
          + tot.toLocaleString('pt-BR') + ' atribuições de sinal aos postos 1…' + ne
          + ' são igualmente prováveis.';
      } else {
        var med = ne * (ne + 1) / 4;
        var dp = Math.sqrt(ne * (ne + 1) * (2 * ne + 1) / 24 - P.correcao / 48);
        nulaNormal(med, dp, Wmais, 'W⁺');
        legenda.innerHTML = 'Com n grande ou com empates nos postos, usa-se a aproximação '
          + 'normal com correção de continuidade e de empates.';
      }

      var dd = medias(d);
      var tt = dd.m / (dd.s / Math.sqrt(n));
      var pt = 2 * (1 - M.FT(Math.abs(tt), n - 1));

      return { est: 'W⁺ = ' + M.fmt(Wmais, 1) + ' , W⁻ = ' + M.fmt(Wmenos, 1),
               n: ne, p: p, pt: pt, d: d, W: W, Wmais: Wmais, Wmenos: Wmenos,
               tt: tt, empates: P.correcao > 0, nome: 'teste t pareado',
               corpo: tabelaPares(A, B, d, P.r) };
    }

    function fazerMW(A, B) {
      var n1 = A.length, n2 = B.length, todos = A.concat(B);
      var P = M.postosMedios(todos);
      var R1 = 0, i;
      for (i = 0; i < n1; i++) R1 += P.r[i];
      var U1 = R1 - n1 * (n1 + 1) / 2;
      var U2 = n1 * n2 - U1;
      var U = Math.min(U1, U2);
      var p = M.pMannWhitney(U1, n1, n2, P.correcao);

      if (n1 <= 12 && n2 <= 12 && !P.correcao) {
        var max = n1 * n2, vals = [], probs = [];
        for (i = 0; i <= max; i++) {
          vals.push(i);
          probs.push(M.FMannWhitney(i, n1, n2) - (i ? M.FMannWhitney(i - 1, n1, n2) : 0));
        }
        var ac = 0, cinf = -1;
        for (i = 0; i <= max; i++) { ac += probs[i]; if (ac > 0.025) break; cinf = i; }
        nulaBarras(vals, probs, U1, cinf >= 0 ? cinf : null,
                   cinf >= 0 ? max - cinf : null, 'U');
        legenda.innerHTML = 'Distribuição <b>exata</b> de U sob H₀: todas as '
          + M.binom(n1 + n2, n1).toLocaleString('pt-BR') + ' maneiras de repartir os postos '
          + 'entre os dois grupos são igualmente prováveis.';
      } else {
        var nT = n1 + n2;
        var med = n1 * n2 / 2;
        var dp = Math.sqrt(n1 * n2 / 12 * (nT + 1 - P.correcao / (nT * (nT - 1))));
        nulaNormal(med, dp, U1, 'U');
        legenda.innerHTML = 'Com grupos grandes ou com empates, usa-se a aproximação normal '
          + 'com correção de continuidade e de empates.';
      }

      var mA = medias(A), mB = medias(B);
      var sp = Math.sqrt(((n1 - 1) * mA.s * mA.s + (n2 - 1) * mB.s * mB.s) / (n1 + n2 - 2));
      var tt = (mA.m - mB.m) / (sp * Math.sqrt(1 / n1 + 1 / n2));
      var pt = 2 * (1 - M.FT(Math.abs(tt), n1 + n2 - 2));

      return { est: 'U₁ = ' + M.fmt(U1, 1) + ' , U₂ = ' + M.fmt(U2, 1),
               n: n1 + '+' + n2, p: p, pt: pt, U: U, U1: U1, R1: R1,
               mA: mA, mB: mB, medA: mediana(A), medB: mediana(B),
               tt: tt, empates: P.correcao > 0, nome: 'teste t independente',
               corpo: tabelaMW(A, B, P.r) };
    }

    function fazerSeq(A) {
      var md = mediana(A);
      var sinais = A.filter(function (v) { return v !== md; })
                    .map(function (v) { return v > md ? 1 : 0; });
      var n1 = sinais.filter(function (v) { return v === 1; }).length;
      var n2 = sinais.length - n1;
      var R = sinais.length ? 1 : 0, i;
      for (i = 1; i < sinais.length; i++) if (sinais[i] !== sinais[i - 1]) R++;
      var S = M.pSequencias(R, n1, n2);
      nulaNormal(S.media, S.dp, R, 'número de sequências R');
      legenda.innerHTML = 'Cada valor é classificado como acima (A) ou abaixo (B) da mediana. '
        + 'Uma <b>sequência</b> é um bloco de letras iguais. Poucas sequências indicam '
        + 'tendência ou agrupamento; muitas indicam alternância sistemática.';
      var letras = sinais.map(function (v) { return v ? 'A' : 'B'; }).join(' ');
      return { est: 'R = ' + R, n: n1 + '+' + n2, p: S.p, pt: NaN,
               R: R, S: S, letras: letras, nome: null, corpo: '' };
    }

    /* ---------- tabelas auxiliares ---------- */
    function tabelaPares(A, B, d, postos) {
      var n = d.length, h = '<table><thead><tr><th class="num">i</th>'
        + '<th class="num">antes</th><th class="num">depois</th>'
        + '<th class="num">d</th><th class="num">sinal</th>'
        + (postos ? '<th class="num">|d|</th><th class="num">posto</th>' : '')
        + '</tr></thead><tbody>';
      var j = 0;
      for (var i = 0; i < n; i++) {
        h += '<tr><td class="num">' + (i + 1) + '</td><td class="num">' + M.fmt(A[i], 2)
          + '</td><td class="num">' + M.fmt(B[i], 2) + '</td><td class="num">'
          + (d[i] > 0 ? '+' : '') + M.fmt(d[i], 2) + '</td><td class="num">'
          + (d[i] > 0 ? '+' : d[i] < 0 ? '−' : '0') + '</td>';
        if (postos) {
          if (d[i] !== 0) {
            h += '<td class="num">' + M.fmt(Math.abs(d[i]), 2) + '</td><td class="num">'
              + M.fmt(postos[j], 1) + '</td>';
            j++;
          } else h += '<td class="num">: </td><td class="num">descartado</td>';
        }
        h += '</tr>';
      }
      return h + '</tbody></table>';
    }

    function tabelaMW(A, B, postos) {
      var h = '<table><thead><tr><th>grupo</th><th class="num">valor</th>'
        + '<th class="num">posto</th></tr></thead><tbody>';
      var ordem = [];
      A.forEach(function (v, i) { ordem.push({ g: 1, v: v, r: postos[i] }); });
      B.forEach(function (v, i) { ordem.push({ g: 2, v: v, r: postos[A.length + i] }); });
      ordem.sort(function (p, q) { return p.v - q.v; });
      ordem.forEach(function (o) {
        h += '<tr><td' + (o.g === 1 ? ' style="color:var(--azul);font-weight:700"' : '')
          + '>' + (o.g === 1 ? 'grupo 1' : 'grupo 2') + '</td><td class="num">'
          + M.fmt(o.v, 2) + '</td><td class="num">' + M.fmt(o.r, 1) + '</td></tr>';
      });
      return h + '</tbody></table>';
    }

    /* ---------- orquestração ---------- */
    function atualizar() {
      var A = ler(iA.value), B = ler(iB.value);
      if (A.length < 3 || (tipo !== 'seq' && B.length < 3)) {
        saida.innerHTML = 'Informe ao menos três valores em cada campo.';
        painel({ est: '—', n: '—', p: '—', pt: '—' });
        tabela.innerHTML = ''; G.preparar(cv, 280);
        return;
      }

      var R;
      if (tipo === 'sinais') R = fazerSinais(A, B);
      else if (tipo === 'wilcoxon') R = fazerWilcoxon(A, B);
      else if (tipo === 'mw') R = fazerMW(A, B);
      else R = fazerSeq(A);

      painel({
        est: R.est, n: String(R.n), p: M.fmt(R.p, 5),
        pt: isFinite(R.pt) ? M.fmt(R.pt, 5) : '—'
      });
      tabela.innerHTML = R.corpo;

      var txt = '';
      if (tipo === 'sinais') {
        txt = 'Das ' + R.d.length + ' diferenças, <b>' + R.est + '</b>'
          + (R.zero ? ' e ' + R.zero + ' nula(s), que são descartadas' : '') + '. '
          + 'Sob H₀ (as duas condições são equivalentes) isso se distribui como uma '
          + 'Binomial(' + R.n + ', ½), e o valor p bilateral é <b>' + M.fmt(R.p, 5) + '</b>: '
          + (R.p < 0.05 ? '<b>rejeitamos H₀</b>.' : '<b>não rejeitamos H₀</b>.');
        txt += '<br><br>O teste t pareado nos mesmos dados dá p = <b>' + M.fmt(R.pt, 5)
          + '</b>. ' + comparacao(R.p, R.pt)
          + '<br><br><i>O teste dos sinais usa apenas o sinal de cada diferença e joga fora '
          + 'o tamanho dela.</i> É o mais robusto e o mais fraco dos três: exige quase nada '
          + 'dos dados e, em troca, detecta pouco.';
      } else if (tipo === 'wilcoxon') {
        txt = 'Somando os postos das diferenças positivas, W⁺ = <b>' + M.fmt(R.Wmais, 1)
          + '</b>; das negativas, W⁻ = <b>' + M.fmt(R.Wmenos, 1) + '</b>. '
          + '<i>Confira:</i> W⁺ + W⁻ deve dar n(n+1)/2 = '
          + M.fmt(R.n * (R.n + 1) / 2, 1) + '. '
          + 'Valor p bilateral = <b>' + M.fmt(R.p, 5) + '</b>: '
          + (R.p < 0.05 ? '<b>rejeitamos H₀</b>.' : '<b>não rejeitamos H₀</b>.')
          + (R.empates ? ' Há empates entre os |d|, de modo que o valor p vem da '
                       + 'aproximação normal com correção.' : '');
        txt += '<br><br>O teste t pareado dá p = <b>' + M.fmt(R.pt, 5) + '</b>. '
          + comparacao(R.p, R.pt)
          + '<br><br><i>Wilcoxon usa o sinal <b>e</b> a ordem das magnitudes.</i> '
          + 'Por isso costuma ficar entre o teste dos sinais e o t: tem cerca de '
          + '<b>95% da eficiência</b> do t quando os dados são de fato normais, e é '
          + '<i>mais</i> poderoso que ele quando não são.';
      } else if (tipo === 'mw') {
        txt = 'Soma dos postos do grupo 1: R₁ = <b>' + M.fmt(R.R1, 1) + '</b>, '
          + 'de onde U₁ = R₁ − n₁(n₁+1)/2 = <b>' + M.fmt(R.U1, 1) + '</b>. '
          + '<i>Confira:</i> U₁ + U₂ = n₁n₂. '
          + 'Valor p bilateral = <b>' + M.fmt(R.p, 5) + '</b>: '
          + (R.p < 0.05 ? '<b>rejeitamos H₀</b>.' : '<b>não rejeitamos H₀</b>.')
          + (R.empates ? ' Há empates entre os valores, de modo que se usa a aproximação '
                       + 'normal com correção.' : '');
        txt += '<br><br><b>Médias:</b> ' + M.fmt(R.mA.m, 2) + ' e ' + M.fmt(R.mB.m, 2)
          + ' &nbsp;·&nbsp; <b>medianas:</b> ' + M.fmt(R.medA, 2) + ' e '
          + M.fmt(R.medB, 2) + '. O teste t independente dá p = <b>' + M.fmt(R.pt, 5)
          + '</b>. ' + comparacao(R.p, R.pt);
        if (R.pt > 0.05 && R.p < 0.05) {
          txt += '<br><br><b>Repare no que aconteceu aqui.</b> O teste t não encontrou nada, '
            + 'e o de Mann–Whitney encontrou um efeito claro. Olhe as médias: elas quase '
            + 'coincidem, enquanto as medianas estão muito distantes. É a assinatura de um '
            + '<b>valor extremo</b> arrastando a média de um dos grupos e inflando a '
            + 'variância: que é o denominador do t. Os postos não se deixam enganar por '
            + 'isso: o maior valor é apenas "o maior", qualquer que seja seu tamanho.';
        }
      } else {
        txt = 'Classificando cada valor em relação à mediana (' + M.fmt(mediana(A), 2)
          + '):<br><code style="font-size:.78rem;letter-spacing:.08em">' + R.letras
          + '</code><br><br>Há <b>R = ' + R.R + '</b> sequências, contra as '
          + M.fmt(R.S.media, 2) + ' ± ' + M.fmt(R.S.dp, 2) + ' esperadas sob a hipótese de '
          + 'aleatoriedade, ou seja, z = <b>' + M.fmt(R.S.z, 3) + '</b> e p = <b>'
          + M.fmt(R.S.p, 5) + '</b>. '
          + (R.S.p < 0.05
              ? '<b>Rejeitamos a aleatoriedade.</b> ' + (R.R < R.S.media
                  ? 'Poucas sequências: os valores vêm agrupados, sinal de <b>tendência</b> '
                    + 'ou de dependência entre observações vizinhas.'
                  : 'Sequências demais: há <b>alternância sistemática</b>, o que também não '
                    + 'é aleatório.')
              : '<b>Não rejeitamos a aleatoriedade:</b> nada de anormal na ordem dos valores.')
          + '<br><br><i>Este teste não olha para os valores, apenas para a ordem em que '
          + 'apareceram.</i> É o que se aplica aos resíduos de uma regressão para detectar '
          + 'curvatura, como vimos no Módulo 13.';
      }
      saida.innerHTML = txt;
    }

    function comparacao(pnp, pt) {
      if (!isFinite(pt)) return '';
      if (pnp < 0.05 && pt >= 0.05)
        return 'O não paramétrico <b>rejeita</b> e o paramétrico <b>não</b>: os pressupostos '
             + 'do teste t provavelmente estão violados.';
      if (pnp >= 0.05 && pt < 0.05)
        return 'O paramétrico <b>rejeita</b> e o não paramétrico <b>não</b>: é o preço da '
             + 'robustez: ao descartar informação, perde-se poder.';
      return 'Os dois concordam na conclusão; o paramétrico costuma dar um p menor quando '
           + 'seus pressupostos valem, porque usa mais informação dos dados.';
    }

    iA.value = NP.sinais.A.join(', ');
    iB.value = NP.sinais.B.join(', ');
    registrarRedesenho(atualizar);
  }

  /* =================================================================
     Calculadora de valores críticos (z, t, qui-quadrado)
     ================================================================= */
  function criticos(raiz) {
    var c = moldura(raiz, 'Calculadora de valores críticos e de valor p');
    var ctr = el('div', { class: 'controles' }); c.appendChild(ctr);

    var dist = 'z', tipo = 'bi', alfa = 0.05, gl = 10, obs = null;

    function selecao(rot, opcoes, inicial, aoMudar) {
      var campo = el('div', { class: 'campo' });
      campo.appendChild(el('label', { html: rot }));
      var s = el('select');
      opcoes.forEach(function (o) {
        s.appendChild(el('option', { value: o[0], texto: o[1] }));
      });
      s.value = inicial;
      campo.appendChild(s); ctr.appendChild(campo);
      s.addEventListener('change', function () { aoMudar(s.value); });
      return campo;
    }

    selecao('Distribuição', [
      ['z', 'Normal padrão (z)'],
      ['t', 't de Student'],
      ['q', 'Qui-quadrado (χ²)']
    ], 'z', function (v) { dist = v; ajustar(); atualizar(); });

    var campoTipo = selecao('Tipo de teste', [
      ['bi', 'Bilateral'],
      ['dir', 'Unilateral à direita'],
      ['esq', 'Unilateral à esquerda']
    ], 'bi', function (v) { tipo = v; atualizar(); });

    selecao('Nível de significância α', [
      ['0.10', '0,10  (90% de confiança)'],
      ['0.05', '0,05  (95% de confiança)'],
      ['0.025', '0,025'],
      ['0.01', '0,01  (99% de confiança)'],
      ['0.005', '0,005'],
      ['0.001', '0,001']
    ], '0.05', function (v) { alfa = Number(v); atualizar(); });

    var campoGl = el('div', { class: 'campo' });
    campoGl.appendChild(el('label', { html: 'Graus de liberdade ν' }));
    var inpGl = el('input', { type: 'number', value: 10, min: 1, max: 300, step: 1 });
    campoGl.appendChild(inpGl); ctr.appendChild(campoGl);
    inpGl.addEventListener('input', function () {
      var v = Math.round(Number(inpGl.value));
      if (v >= 1 && v <= 300) { gl = v; atualizar(); }
    });

    var campoObs = el('div', { class: 'campo' });
    campoObs.appendChild(el('label', { html: 'Estatística observada <i>(opcional)</i>' }));
    var inpObs = el('input', { type: 'number', step: 'any', placeholder: 'deixe vazio para só ver o crítico' });
    campoObs.appendChild(inpObs); ctr.appendChild(campoObs);
    inpObs.addEventListener('input', function () {
      obs = inpObs.value === '' ? null : Number(inpObs.value);
      atualizar();
    });

    function ajustar() {
      campoGl.style.display = dist === 'z' ? 'none' : '';
      /* χ² à esquerda existe (teste para variância), mas o bilateral precisa dos dois cortes */
      campoTipo.style.display = '';
    }
    ajustar();

    var cv = el('canvas'); c.appendChild(cv);
    c.appendChild(el('div', { class: 'legenda', html:
      'Faixa azul: <b>região de não rejeição</b> de H₀ &nbsp;·&nbsp; '
      + 'faixas vermelhas: <b>região crítica</b>, de área total α &nbsp;·&nbsp; '
      + 'linhas tracejadas: valores críticos &nbsp;·&nbsp; linha verde: estatística observada' }));

    var painel = cartoes(c, [
      { rot: 'crítico inferior', k: 'ci' }, { rot: 'crítico superior', k: 'cs' },
      { rot: 'estatística', k: 'ob' }, { rot: 'valor p', k: 'p' }
    ]);
    var saida = el('div', { class: 'saida' }); c.appendChild(saida);

    function nomeEstat() { return dist === 'z' ? 'z' : (dist === 't' ? 't' : 'χ²'); }

    function densidade(x) {
      if (dist === 'z') return M.dNormal(x, 0, 1);
      if (dist === 't') return M.dT(x, gl);
      return M.dQui(x, gl);
    }

    function acumulada(x) {
      if (dist === 'z') return M.FNormal(x, 0, 1);
      if (dist === 't') return M.FT(x, gl);
      return M.FQui(x, gl);
    }

    /* devolve o valor cuja cauda DIREITA tem área a */
    function criticoDireita(a) {
      if (dist === 'z') return M.zCritico(1 - a);
      if (dist === 't') return M.tCritico(a, gl);
      return M.quiCritico(a, gl);
    }

    function atualizar() {
      var ci = null, cs = null;
      if (tipo === 'bi') {
        if (dist === 'q') { ci = criticoDireita(1 - alfa / 2); cs = criticoDireita(alfa / 2); }
        else { cs = criticoDireita(alfa / 2); ci = -cs; }
      } else if (tipo === 'dir') {
        cs = criticoDireita(alfa);
      } else {
        if (dist === 'q') ci = criticoDireita(1 - alfa);
        else ci = -criticoDireita(alfa);
      }

      /* valor p */
      var p = null;
      if (obs !== null && isFinite(obs)) {
        var caudaDir = 1 - acumulada(obs), caudaEsq = acumulada(obs);
        if (tipo === 'dir') p = caudaDir;
        else if (tipo === 'esq') p = caudaEsq;
        else p = dist === 'q'
          ? Math.min(1, 2 * Math.min(caudaDir, caudaEsq))
          : 2 * (1 - acumulada(Math.abs(obs)));
      }

      function sinal(s) { return s.replace(/^-/, '−'); }
      painel({
        ci: ci === null ? '—' : sinal(M.fmt(ci, 4)),
        cs: cs === null ? '—' : sinal(M.fmt(cs, 4)),
        ob: obs === null ? '—' : sinal(M.fmt(obs, 4)),
        p: p === null ? '—' : M.fmt(p, 4)
      });

      /* ----- gráfico ----- */
      var xmin, xmax;
      if (dist === 'q') {
        xmin = 0;
        xmax = Math.max(cs !== null ? cs * 1.35 : 0, ci !== null ? ci * 2 : 0,
                        gl + 4 * Math.sqrt(2 * gl) + 4, obs !== null ? obs * 1.2 : 0);
      } else {
        var lim = Math.max(3.6, Math.abs(cs || 0) * 1.3, Math.abs(ci || 0) * 1.3,
                           obs !== null ? Math.abs(obs) * 1.15 : 0);
        xmin = -lim; xmax = lim;
      }

      var ymax = 0;
      for (var i = 0; i <= 200; i++) {
        var v = densidade(xmin + (xmax - xmin) * i / 200);
        if (isFinite(v)) ymax = Math.max(ymax, v);
      }
      ymax *= 1.22;
      if (!isFinite(ymax) || ymax <= 0) ymax = 0.45;

      var g = G.eixos(cv, {
        xmin: xmin, xmax: xmax, ymax: ymax, altura: 300,
        rotX: nomeEstat(), rotY: 'densidade',
        marcasX: dist === 'q' ? G.marcasLineares(xmin, xmax, 8, 1)
                              : G.marcasLineares(xmin, xmax, 8, 1),
        formataY: function (v) { return v.toFixed(2).replace('.', ','); }
      });

      var AZUL = 'rgba(31,78,121,.16)', VERM = 'rgba(140,47,57,.30)';
      var a0 = ci === null ? xmin : ci;
      var b0 = cs === null ? xmax : cs;
      G.area(g, densidade, a0, b0, AZUL);
      if (ci !== null) G.area(g, densidade, xmin, ci, VERM);
      if (cs !== null) G.area(g, densidade, cs, xmax, VERM);

      G.curva(g, densidade, G.COR.vinho, 2.4);
      if (ci !== null) G.vertical(g, ci, G.COR.vinho, sinal(M.fmt(ci, 3).replace(/<[^>]*>/g, '')));
      if (cs !== null) G.vertical(g, cs, G.COR.vinho, sinal(M.fmt(cs, 3).replace(/<[^>]*>/g, '')));
      if (obs !== null && isFinite(obs) && obs >= xmin && obs <= xmax)
        G.vertical(g, obs, '#2e7d4f', nomeEstat() + ' obs');

      /* ----- texto ----- */
      var nome = nomeEstat();
      var conf = M.pct(1 - alfa, alfa < 0.01 ? 2 : 0);
      var txt = '';
      if (tipo === 'bi') {
        txt = 'Teste <b>bilateral</b> a α = ' + M.fmt(alfa, 3) + ' ('
            + conf + ' de confiança)' + (dist === 'z' ? '' : ' com ν = <b>' + gl + '</b>')
            + '. Rejeita-se H₀ se ' + nome + ' &lt; <b>' + sinal(M.fmt(ci, 3))
            + '</b> ou ' + nome + ' &gt; <b>' + sinal(M.fmt(cs, 3)) + '</b>. '
            + 'Cada cauda tem área α/2 = ' + M.fmt(alfa / 2, 4) + '.';
      } else if (tipo === 'dir') {
        txt = 'Teste <b>unilateral à direita</b> a α = ' + M.fmt(alfa, 3)
            + (dist === 'z' ? '' : ' com ν = <b>' + gl + '</b>')
            + '. Rejeita-se H₀ se ' + nome + ' &gt; <b>' + sinal(M.fmt(cs, 3))
            + '</b>. Toda a área α fica na cauda direita: por isso o crítico unilateral é '
            + '<i>menor</i> que o bilateral do mesmo α.';
      } else {
        txt = 'Teste <b>unilateral à esquerda</b> a α = ' + M.fmt(alfa, 3)
            + (dist === 'z' ? '' : ' com ν = <b>' + gl + '</b>')
            + '. Rejeita-se H₀ se ' + nome + ' &lt; <b>' + sinal(M.fmt(ci, 3)) + '</b>.';
      }

      if (p !== null) {
        var rejeita = (ci !== null && obs < ci) || (cs !== null && obs > cs);
        txt += '<br><br>Com ' + nome + '<sub>obs</sub> = <b>' + sinal(M.fmt(obs, 3))
             + '</b>, o valor p é <b>' + M.fmt(p, 4) + '</b>, de modo que '
             + (rejeita
                ? '<b>rejeitamos H₀</b> ao nível de ' + M.fmt(alfa, 3)
                  + ': a estatística caiu na região crítica, e p &lt; α.'
                : '<b>não rejeitamos H₀</b> ao nível de ' + M.fmt(alfa, 3)
                  + ': a estatística caiu na região de não rejeição, e p &gt; α.')
             + ' As duas leituras (comparar com o crítico ou comparar p com α) '
             + 'sempre concordam, porque são a mesma conta vista de dois lados.';
      } else {
        txt += ' Informe uma estatística observada para obter também o valor p.';
      }

      if (dist === 'q' && tipo === 'bi')
        txt += '<br><br><i>No qui-quadrado o bilateral não é simétrico:</i> a distribuição é '
             + 'assimétrica e definida só para valores positivos, de modo que os dois cortes '
             + 'têm de ser buscados separadamente: um com área α/2 à esquerda, outro com α/2 '
             + 'à direita.';

      saida.innerHTML = txt;
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
    pascal: pascal, aniversarios: aniversarios, montyhall: montyhall,
    galton: galton, intervalos: intervalos, calcic: calcIC,
    regiaocritica: regiaoCritica, poder: poderTeste,
    contingencia: contingencia, aderencia: aderencia, qqplot: qqplot,
    correlacao: correlacao, criticos: criticos,
    regressao: regressao, linearizacao: linearizacao,
    naoparametrico: naoParametrico,
    coefsw: coefSW, escadaks: escadaKS,
    tamanhoamostral: tamanhoAmostral, curvaspoder: curvasPoder,
    algarismos: algarismos, instrumentos: instrumentos, alvos: alvos,
    verossimilhanca: verossimilhanca, limitenormal: limiteNormal,
    propagacao: propagacao, polinomio: polinomio, naolinear: naoLinear
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
