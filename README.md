# Probabilidade & Estatística — Licenciatura em Física EAD

Material interativo da disciplina de Probabilidade e Estatística do curso de
Licenciatura em Física EAD da **Universidade Regional do Cariri (URCA)**.

**Prof. Apiano Morais** — Laboratório de Física Computacional Aplicada (LFCA)
apiano.morais@urca.br

## Conteúdo

Cinco módulos de aproximadamente três horas cada, com teoria, exercícios
resolvidos e simuladores interativos:

| Módulo | Tema |
|---|---|
| 1 | Espaço amostral, eventos e axiomas de Kolmogorov |
| 2 | Técnicas de contagem: permutações, arranjos e combinações |
| 3 | Probabilidade condicional e teorema de Bayes |
| 4 | Variáveis aleatórias discretas: Bernoulli, Binomial e Poisson |
| 5 | Variáveis aleatórias contínuas, Normal e Teorema Central do Limite |

Há ainda uma página de **formulário** com todas as fórmulas do curso e a tabela
da normal padrão, formatada para impressão.

## Simuladores

Treze componentes interativos em JavaScript puro, sem bibliotecas externas:
soma de dois dados, diagrama de Venn, Monte Carlo do problema do encontro,
calculadora combinatória, calculadora de Bayes com frequências naturais,
distribuição discreta definida pelo usuário, binomial com aproximações,
Poisson, normal com área sob a curva, Teorema Central do Limite, passeio
aleatório, lei dos grandes números e distribuição exponencial.

## Como rodar localmente

Não há etapa de compilação. Basta servir a pasta:

```bash
python3 -m http.server 8000
```

e abrir <http://localhost:8000>.

## Publicação

O site é estático e usa apenas caminhos relativos, portanto funciona tanto na
raiz de um domínio quanto em um subdiretório. Para publicar no GitHub Pages:
**Settings → Pages → Deploy from a branch → `main` → `/ (root)`**.

## Erros e sugestões

Encontrou um erro no material? Abra uma *issue* descrevendo o módulo e a seção.

## Licença

Material didático de uso livre para fins educacionais, com atribuição.
