import { Menu } from "../components/Menu";
import { MenuHero } from "../components/MenuHero";
import { SectionNav } from "../components/SectionNav";

export default function MenuPage() {
  return (
    <main className="flex-1">
      <MenuHero />
      <SectionNav />
      <Menu />
    </main>
  );
}
