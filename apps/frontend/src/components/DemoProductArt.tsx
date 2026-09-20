import Icon, { IconName } from "./Icon";

/** Generic sample packaging, deliberately not represented as a product photo. */
export default function DemoProductArt({ category, name, pack }: { category?: string; name: string; pack?: string }) {
  const liquid = /oil|milk|juice|liquid|care|sauce/i.test(category || "");
  const fresh = /fresh|leafy/i.test(category || "");
  const icon: IconName = fresh ? "leaf" : liquid ? "cup" : "box";
  return <div className={`demo-art ${liquid ? "bottle-art" : "pouch-art"}`} aria-label={`Sample illustration for ${name}`} role="img"><div className="demo-package"><span className="demo-package-brand">Subah <b>BD</b></span><Icon name={icon} width={38} height={38} /><strong>{name.split(" · ")[0]}</strong><small>{pack || category}</small><span className="demo-package-line" /></div><span className="demo-art-caption">SAMPLE ILLUSTRATION</span></div>;
}
