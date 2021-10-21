export const UtterancesComments: React.FC = () => (
    <section
      ref={elem => {
        if (!elem || elem.childNodes.length) {
          return;
        }
        const scriptElem = document.createElement("script");
        scriptElem.src = "https://utteranc.es/client.js";
        scriptElem.async = true;
        scriptElem.crossOrigin = "anonymous";
        scriptElem.setAttribute("repo", "ericovasconcelos/chap3-challenge1");
        scriptElem.setAttribute("issue-term", "pathname");
        scriptElem.setAttribute("theme", "github-dark");
        scriptElem.setAttribute("theme", "github-dark");
        elem.appendChild(scriptElem);
      }}
    />
  );