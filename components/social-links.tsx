const socials = [
  { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61561340147337", icon: "facebook" },
  { name: "TikTok", url: "https://www.tiktok.com/@aguavaiyo", icon: "tiktok" },
  { name: "Instagram", url: "https://www.instagram.com/aguavaiyo?vrfl=N2l0djV6ODMzMThi", icon: "instagram" },
] as const;

function SocialIcon({ name }: { name: typeof socials[number]["icon"] }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    {name === "facebook" && <path fill="currentColor" d="M14.2 21v-8.2H17l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H8v3.2h2.8V21z"/>}
    {name === "instagram" && <g fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" stroke="none"/></g>}
    {name === "tiktok" && <path fill="currentColor" d="M16.5 3c.3 2.3 1.6 3.8 4 4.1v3.1a8.4 8.4 0 0 1-4-1.2v7.1a5.5 5.5 0 1 1-5.5-5.5c.4 0 .8 0 1.2.1V14a2.4 2.4 0 1 0 1.1 2V3z"/>}
  </svg>;
}

export default function SocialLinks() {
  return <div className="footer-social"><span>Síguenos</span><nav className="footer-social-links" aria-label="Redes sociales de VAIYO">
    {socials.map(social => <a key={social.name} href={social.url} aria-label={`VAIYO en ${social.name}`} title={social.name} target="_blank" rel="noopener noreferrer"><SocialIcon name={social.icon}/></a>)}
  </nav></div>;
}
