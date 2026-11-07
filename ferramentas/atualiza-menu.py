#!/usr/bin/env python3
"""Reescreve o menu de navegacao e a navegacao de rodape em todas as paginas.

Uso:  python3 ferramentas/atualiza-menu.py
Roda a partir da raiz do site. A unica fonte de verdade e a lista UNIDADES
abaixo: mudando a ordem ali, o menu do topo e as setas anterior/proximo de
todas as paginas se reorganizam sozinhos.
"""
import glob
import os
import re

# (numero, titulo curto para o menu, titulo para a seta do rodape)
TITULOS = {
    1:  ("Erros de medida e algarismos significativos", "Erros e algarismos significativos"),
    2:  ("Estatística descritiva", "Estatística descritiva"),
    3:  ("Variáveis aleatórias discretas", "Variáveis aleatórias discretas"),
    4:  ("Variáveis contínuas e a Normal", "Variáveis contínuas e a Normal"),
    5:  ("Máxima verossimilhança e a dedução da Normal", "Máxima verossimilhança"),
    6:  ("Amostragem e o teorema central do limite", "Amostragem e o TCL"),
    7:  ("Propagação de erros", "Propagação de erros"),
    8:  ("Regressão linear e mínimos quadrados", "Regressão linear"),
    9:  ("Ajuste de polinômios e mínimos quadrados ponderados", "Ajuste de polinômios"),
    10: ("Ajuste não linear e o qui-quadrado de ajuste", "Ajuste não linear"),
    11: ("Estimação e intervalos de confiança", "Intervalos de confiança"),
    12: ("Testes de hipóteses", "Testes de hipóteses"),
    13: ("Testes qui-quadrado", "Testes qui-quadrado"),
    14: ("Espaço amostral, eventos e axiomas", "Espaço amostral e axiomas"),
    15: ("Técnicas de contagem", "Técnicas de contagem"),
    16: ("Probabilidade condicional e Bayes", "Probabilidade condicional e Bayes"),
    17: ("Testes de normalidade", "Testes de normalidade"),
    18: ("Correlação", "Correlação"),
    19: ("Testes não paramétricos", "Testes não paramétricos"),
    20: ("Tamanho amostral e planejamento", "Tamanho amostral"),
}

UNIDADES = [
    ("Unidade 1 · Fundamentos e Estatística Descritiva", "Fundamentos", [1, 2]),
    ("Unidade 2 · Variáveis Contínuas e Distribuição Normal", "Normal", [3, 4, 5, 6]),
    ("Unidade 3 · Propagação de Erros e Ajuste de Dados", "Ajuste", [7, 8, 9, 10]),
    ("Unidade 4 · Testes de Hipóteses e Significância", "Testes", [11, 12, 13]),
    ("Módulos complementares", "Complementares", [14, 15, 16, 17, 18, 19, 20]),
]

# o que vai no chapéu de cada página, logo acima do título
CHAPEU = {
    1: "Unidade 1", 2: "Unidade 1",
    3: "Unidade 2", 4: "Unidade 2", 5: "Unidade 2", 6: "Unidade 2",
    7: "Unidade 3", 8: "Unidade 3", 9: "Unidade 3", 10: "Unidade 3",
    11: "Unidade 4", 12: "Unidade 4", 13: "Unidade 4",
    14: "Complementar", 15: "Complementar", 16: "Complementar",
    17: "Complementar", 18: "Complementar", 19: "Complementar",
    20: "Complementar",
}

# ordem linear em que as setas anterior/proximo caminham
ORDEM = [n for _, _, ns in UNIDADES for n in ns]


def existentes():
    return {n for n in TITULOS if os.path.exists("aula%02d.html" % n)}


def monta_menu(pagina_atual):
    def link(href, texto, titulo=None, classe=""):
        at = ' class="%s"' % (classe + (" ativo" if href == pagina_atual else "")).strip() \
            if (classe or href == pagina_atual) else ""
        tt = ' title="%s"' % titulo if titulo else ""
        return '<a href="%s"%s%s>%s</a>' % (href, at, tt, texto)

    tem = existentes()
    partes = [link("index.html", "Início")]

    for _, curto, numeros in UNIDADES:
        presentes = [n for n in numeros if n in tem]
        if not presentes:
            continue
        partes.append('<span class="grupo">%s</span>' % curto)
        for n in presentes:
            partes.append(link("aula%02d.html" % n, str(n),
                               "Módulo %d: %s" % (n, TITULOS[n][0]), "num"))

    partes.append(link("formulario.html", "Formulário"))
    return "\n      " + "\n      ".join(partes) + "\n    "


def monta_rodape(n):
    """Setas anterior/proximo para o modulo n, segundo ORDEM."""
    tem = existentes()
    seq = [m for m in ORDEM if m in tem]
    if n not in seq:
        return None
    i = seq.index(n)
    partes = []

    if i > 0:
        a = seq[i - 1]
        partes.append('<a href="aula%02d.html"><small>Módulo anterior</small>'
                      '← %d. %s</a>' % (a, a, TITULOS[a][1]))
    else:
        partes.append('<a href="index.html"><small>Voltar</small>← Início</a>')

    if i < len(seq) - 1:
        b = seq[i + 1]
        partes.append('<a class="prox" href="aula%02d.html"><small>Próximo módulo</small>'
                      '%d. %s →</a>' % (b, b, TITULOS[b][1]))
    else:
        partes.append('<a class="prox" href="formulario.html">'
                      '<small>Material de apoio</small>Formulário e tabelas →</a>')

    return "\n    " + "\n    ".join(partes) + "\n  "


def main():
    paginas = sorted(glob.glob("*.html"))
    pad_menu = re.compile(r'<nav class="menu">.*?</nav>', re.S)
    pad_rod = re.compile(r'<nav class="nav-aulas">.*?</nav>', re.S)

    for p in paginas:
        texto = open(p, encoding="utf-8").read()
        original = texto

        if pad_menu.search(texto):
            novo = '<nav class="menu">%s</nav>' % monta_menu(p)
            texto = pad_menu.sub(lambda _: novo, texto, count=1)
        else:
            print('AVISO: nenhum <nav class="menu"> em', p)

        if p == "formulario.html" and pad_rod.search(texto):
            tem = existentes()
            ult = max((x for x in ORDEM if x in tem), default=None)
            if ult:
                rod = ('\n    <a href="aula%02d.html"><small>Último módulo</small>'
                       '← %d. %s</a>'
                       '\n    <a class="prox" href="index.html"><small>Voltar</small>'
                       'Página inicial →</a>\n  ') % (ult, ult, TITULOS[ult][1])
                novo_r = '<nav class="nav-aulas">%s</nav>' % rod
                texto = pad_rod.sub(lambda _: novo_r, texto, count=1)

        m = re.match(r'aula(\d{2})\.html$', p)
        if m:
            n = int(m.group(1))
            if n in CHAPEU:
                texto = re.sub(
                    r'(<p class="chapeu">)Módulo \d+[^<]*(</p>)',
                    lambda _: '%sMódulo %d · 3 horas · %s%s'
                              % ('<p class="chapeu">', n, CHAPEU[n], '</p>'),
                    texto, count=1)
            rod = monta_rodape(int(m.group(1)))
            if rod and pad_rod.search(texto):
                novo = '<nav class="nav-aulas">%s</nav>' % rod
                texto = pad_rod.sub(lambda _: novo, texto, count=1)
            elif rod:
                print('AVISO: nenhum <nav class="nav-aulas"> em', p)

        if texto != original:
            open(p, "w", encoding="utf-8").write(texto)
            print("atualizado:", p)


if __name__ == "__main__":
    main()
