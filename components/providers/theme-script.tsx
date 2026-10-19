/** Runs before first paint (server-rendered inline script) so there's no light/dark flash. */
export function ThemeScript() {
  const js = `try{var t=localStorage.getItem("wp_theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
