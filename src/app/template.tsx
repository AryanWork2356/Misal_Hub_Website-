/** Re-mounts on every navigation, giving each page a soft fade-in (see .page-enter in globals.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
