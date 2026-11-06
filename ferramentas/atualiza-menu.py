#!/usr/bin/env python3
"""Reescreve o menu de navegacao em todas as paginas do site.

Uso:  python3 ferramentas/atualiza-menu.py
Roda a partir da raiz do site. Detecta quais modulos existem e monta o
menu agrupado em Probabilidade (1-5) e Estatistica (6-11).
"""
import glob
import os
import re

TITULOS = {
    1: "Espaço amostral, eventos e axiomas",
    2: "Técnicas de contagem",
    3: "Probabilidade condicional e Bayes",
    4: "Variáveis aleatórias discretas",
    5: "Variáveis contínuas e a Normal",
    6: "Estatística descritiva",
    7: "Amostragem e distribuições amostrais",
    8: "Estimação e intervalos de confiança",
    9: "Testes de hipóteses",
    10: "Testes qui-quadrado",
    11: "Testes de normalidade",
    12: "Correlação",
}


def monta_menu(pagina_atual):
    def link(href, texto, titulo=None, classe=""):
        at = ' class="%s"' % (classe + (" ativo" if href == pagina_atual else "")).strip() \
            if (classe or href == pagina_atual) else ""
        tt = ' title="%s"' % titulo if titulo else ""
        return '<a href="%s"%s%s>%s</a>' % (href, at, tt, texto)

    existentes = {
        n for n in TITULOS
        if os.path.exists("aula%02d.html" % n)
    }

    partes = [link("index.html", "Início")]

    for rotulo, faixa in (("Probabilidade", range(1, 6)),
                          ("Estatística", range(6, 13))):
        numeros = [n for n in faixa if n in existentes]
        if not numeros:
            continue
        partes.append('<span class="grupo">%s</span>' % rotulo)
        for n in numeros:
            partes.append(link("aula%02d.html" % n, str(n),
                               "Módulo %d — %s" % (n, TITULOS[n]), "num"))

    partes.append(link("formulario.html", "Formulário"))
    return "\n      " + "\n      ".join(partes) + "\n    "


def main():
    paginas = sorted(glob.glob("*.html"))
    padrao = re.compile(r'<nav class="menu">.*?</nav>', re.S)
    for p in paginas:
        texto = open(p, encoding="utf-8").read()
        novo = '<nav class="menu">%s</nav>' % monta_menu(p)
        if padrao.search(texto):
            texto = padrao.sub(lambda _: novo, texto, count=1)
            open(p, "w", encoding="utf-8").write(texto)
            print("menu atualizado:", p)
        else:
            print("AVISO: nenhum <nav class=\"menu\"> em", p)


if __name__ == "__main__":
    main()
