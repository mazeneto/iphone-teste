# iPhone 18 Pro — site conceito

Landing page conceitual do iPhone 18 Pro no estilo Apple, feita como estudo de animação e front-end. É HTML, CSS e JavaScript puro, sem build e sem dependências para instalar.

> Projeto de estudo sem vínculo com a Apple. As especificações, os nomes de cores e os números são ilustrativos.

## Como rodar

Os módulos JS não carregam pelo `file://`, então rode com qualquer servidor estático:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

### GitHub Pages

Suba o repositório e ative **Settings → Pages → Deploy from a branch** apontando para a `main` (pasta `/root`). O `index.html` na raiz já é a página.

## Estrutura

```
index.html
assets/
  css/style.css          estilos da página
  js/main.js             animações (GSAP, Lenis, WarpText, aurora, etc.)
  img/pessoas.webp       foto original do card de abertura
  img/pessoas-fundo.webp fundo sem as pessoas (é ele que desfoca)
  img/pessoas-recorte.webp pessoas recortadas, sempre nítidas
  img/cidade.webp        foto do card de zoom
vendor/
  gsap.min.js            GSAP 3.12.5
  ScrollTrigger.min.js   plugin ScrollTrigger 3.12.5
  lenis.min.js           Lenis 1.1.13 (scroll suave)
```

## Efeitos

| Onde | Efeito |
|------|--------|
| Fundo da página | fundo quase preto com pinceladas de azul e uma aurora sutil (WebGL2) |
| Título do hero | WarpText (WebGL2): lente de vidro que segue o mouse |
| Hero | partículas que desviam do cursor, parallax 3D dos aparelhos |
| Botões | magnéticos, seguem levemente o cursor |
| Design | seção fixa em que o aparelho gira conforme o scroll |
| Texto | revelação palavra por palavra, decriptação e contadores |
| Câmeras | cards bento com spotlight e tilt; slider de abertura que desfoca só o fundo da foto (pessoas recortadas em camada separada) e zoom de 1x a 8x na foto da cidade, controlado por slider ou pela rodinha do mouse (aproxima onde está o cursor) |
| Marquee | velocidade e direção seguem o scroll |
| Cores | seletor que gira o aparelho e troca a cor de destaque |
| Recursos | cards empilhados com `position: sticky` |
| Final | título que sobe suavemente ao entrar na tela |

Tudo respeita `prefers-reduced-motion`.

## Compatibilidade

- **WebGL2** (fundo e título): todos os navegadores atuais. Sem WebGL2, o fundo fica só com o gradiente e o título aparece em texto normal.

## Créditos

- Componentes Aurora e WarpText: [React Bits](https://reactbits.dev), adaptados para JavaScript puro.
- [GSAP](https://gsap.com) e [Lenis](https://lenis.darkroom.engineering).
