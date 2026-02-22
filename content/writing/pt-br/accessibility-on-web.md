---
title: Acessibilidade na web
url: /writing/accessibility-on-web
publishedAt: 2024-01-09T03:00:00Z
updatedAt: 2024-07-24T03:00:00Z
description: Esta é apenas uma introdução baseada na minha pesquisa pessoal e anotações sobre acessibilidade na web.
keywords: a11y, frontend, web, wcag
---

## Introdução

Esta é apenas uma introdução baseada na minha pesquisa pessoal e anotações sobre acessibilidade na web.

## Benefícios da acessibilidade

Em uma pesquisa de Rebecca Wettemann & Trevor White chamada [_The Internet is Unavailable_](https://nucleusresearch.com/research/single/the-internet-is-unavailable/), eles afirmam:

> Apenas para varejistas da Internet, negar acesso total a consumidores cegos está deixando até US$ 6,9 bilhões anualmente para um punhado de alternativas acessíveis.

Em outras palavras, não tornar seu site acessível, além de antiético, pode causar uma perda significativa de usuários, dependendo do tipo de negócio que seu site opera.

Para tornar seu site acessível, vamos entender o trabalho que foi feito para torná-lo possível com o WCAG.

## WCAG

### O que é?

O [WCAG](https://www.w3.org/TR/WCAG21/) é um guia criado pela [WAI](https://www.w3.org/WAI/) (Web Accessibility Initiative) através do [W3C](https://www.w3.org/) (The World Wide Web Consortium), que desenvolve padrões e diretrizes para ajudar a todos a construir uma web baseada em princípios de acessibilidade, internacionalização, privacidade e segurança.

A estrutura do guia é dividida em quatro camadas aninhadas:

- **Princípios**: No topo estão quatro princípios que constituem a base da acessibilidade na Web: _Perceptível, Operável, Compreensível e Robusto_.
  - **Diretrizes**: Abaixo dos princípios estão as diretrizes. As treze diretrizes fornecem os objetivos básicos que devem ser alcançados para tornar o conteúdo mais acessível aos usuários com deficiência.
    - **Critérios de Sucesso**: Para cada diretriz, são dados critérios de sucesso, a fim de atender às necessidades de múltiplos grupos e situações, são definidos três níveis de conformidade: A (o mais baixo), AA e AAA (o mais alto).
      - **Técnicas**: As técnicas são informativas e têm duas categorias: aquelas que são _suficientes_ para atender aos critérios de sucesso e aquelas que são _consultivas_.

Agora vamos abordar alguns dos princípios e destacar algumas diretrizes importantes para esses princípios de forma **MUITO** resumida. A recomendação é ler o guia oficial do [WCAG](https://www.w3.org/TR/WCAG21/).

Mas antes, para esclarecer os critérios de sucesso, seu site não precisa seguir todos os critérios AAA (triple A), apenas AA e A são suficientes para ter um site acessível.

### Perceptível

- Fornecer alternativas textuais para qualquer conteúdo não textual.
- Fornecer alternativas para mídias baseadas em tempo.
  - Legendas
  - Legendas ocultas
  - Linguagem de sinais
- Criar conteúdo que possa ser apresentado de diferentes maneiras (por exemplo, um layout simplificado).
- Para facilitar a audição e visualização do conteúdo para os usuários.
  - Não usar apenas cores para transmitir informações e usar o contraste correto de cores.

### Operável

- Tornar toda a funcionalidade disponível através do teclado.
- Fornecer aos usuários tempo suficiente para ler e usar o conteúdo.
  - Se você tiver um componente que muda com base no tempo, forneça funcionalidades para pausar, parar ou estender o tempo.
- Não projetar conteúdo de forma que se saiba que causa convulsões ou reações físicas.
  - Evitar criar sites com animações excessivas e coisas piscando na tela; se necessário, fornecer uma opção para reduzir as animações usando `prefers-reduced-motion`.

### Compreensível

- Tornar o conteúdo textual legível e compreensível.
- Fazer com que as páginas da Web apareçam e funcionem de maneiras previsíveis.

### Robusto

- O conteúdo deve ser robusto o suficiente para ser interpretado por uma ampla variedade de agentes de usuário, incluindo tecnologias assistivas.

Lembrando que os pontos acima são extremamente resumidos, no guia você encontrará os critérios de sucesso para cada diretriz e seus níveis.

## Tornando seu site acessível

O segredo para tornar seu site pronto para tecnologias assistivas está na semântica do seu HTML, a base é escolher sabiamente os elementos HTML usados para construir seu site.

Não use apenas divs e spans para construir seu site, use-os apenas para fins de estilo.

Cada estado do seu componente precisa ser comunicado aos usuários, se está aberto ou não, se está relacionado a outro elemento. Todas essas coisas precisam ser comunicadas ao usuário.

## Accessible Rich Internet Applications (ARIA)

O ARIA é um conjunto de atributos especiais para acessibilidade, que podem ser adicionados a qualquer linguagem de marcação, mas é especialmente projetado para HTML.

Esses atributos podem ser categorizados em roles, states e properties.

As properties podem ser usadas para dar mais significado ou semântica a um elemento, por exemplo, `aria-label`, onde você pode adicionar um rótulo a qualquer elemento que não tenha um, fornecendo mais contexto.

Os states definem a condição atual de um elemento, por exemplo, `aria-disabled`, que especifica para leitores de tela que um elemento está desabilitado.

Os roles definem o que o elemento é; imagine um role como um preset, porque um role usa outros atributos ARIA para dizer o que aquele elemento é. Por exemplo, `role="alert"` por baixo dos panos usa `aria-live="assertive"` e `aria-atomic="true"`.

## Conclusão

Então é isso, esta é uma introdução à acessibilidade na web, há muito a aprender ao longo do caminho. Espero que este artigo tenha ajudado de alguma forma, é o primeiro artigo que estou escrevendo e a primeira vez tentando escrever em inglês (atualmente aprendendo inglês).

Até mais!

## Referências

- [Vamos falar sobre Acessibilidade na Web?](https://youtu.be/QLO0iZ1BbQo?si=XiP_pXnWudcCnu3x)
- [WAI-ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [WCAG](https://www.w3c.br/traducoes/wcag/wcag21-pt-BR/#abstract)
- [Supreme Court hands victory to blind man who sued Domino’s over site accessibility](https://www.cnbc.com/2019/10/07/dominos-supreme-court.html)
- [The Internet is unavailable](https://nucleusresearch.com/research/single/the-internet-is-unavailable/)