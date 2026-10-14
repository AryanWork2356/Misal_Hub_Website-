import ScrollProgress from './ScrollProgress';
import PageEffects from './PageEffects';

/**
 * Every page renders inside <PageShell page="...">. The wrapper class (.pg-home, .pg-menu, ...)
 * is what the generated, scoped stylesheet in src/styles/<page>.css hangs off.
 */
export default function PageShell({ page, className = '', children }: { page: 'home' | 'menu' | 'about' | 'franchise'; className?: string; children: React.ReactNode }) {
  return (
    <div className={`pg-${page} ${className}`.trim()}>
      <ScrollProgress />
      {children}
      <PageEffects />
    </div>
  );
}

