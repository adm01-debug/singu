import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartBreadcrumbs, AnimatedTabs, SkipToContent, AccessibleMotion, LiveRegion } from '../NavigationPatterns';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('SmartBreadcrumbs', () => {
  const items = [
    { label: 'Home', path: '/' },
    { label: 'Contatos', path: '/contatos' },
    { label: 'João Silva', path: '/contatos/123' },
  ];

  it('renders breadcrumb navigation', () => {
    render(<SmartBreadcrumbs items={items} />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders all breadcrumb items', () => {
    render(<SmartBreadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('renders last item as current page', () => {
    render(<SmartBreadcrumbs items={items} />);
    const lastItem = screen.getByText('João Silva');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders links for non-last items', () => {
    render(<SmartBreadcrumbs items={items} />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.tagName).toBe('A');
  });

  it('collapses items when exceeding maxItems', () => {
    const manyItems = [
      { label: 'Home', path: '/' },
      { label: 'Section', path: '/section' },
      { label: 'Subsection', path: '/section/sub' },
      { label: 'Category', path: '/section/sub/cat' },
      { label: 'Item', path: '/section/sub/cat/item' },
    ];
    render(<SmartBreadcrumbs items={manyItems} maxItems={3} />);
    expect(screen.getByLabelText('Ver itens ocultos')).toBeInTheDocument();
  });

  it('renders chevron separators between items', () => {
    const { container } = render(<SmartBreadcrumbs items={items} />);
    const chevrons = container.querySelectorAll('[aria-hidden]');
    expect(chevrons.length).toBeGreaterThan(0);
  });
});

describe('AnimatedTabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3', disabled: true },
  ];

  it('renders all tabs', () => {
    render(<AnimatedTabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<AnimatedTabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('Tab 1').closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Tab 2').closest('button')).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(<AnimatedTabs tabs={tabs} activeTab="tab1" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('disables tab when disabled is true', () => {
    render(<AnimatedTabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('Tab 3').closest('button')).toBeDisabled();
  });

  it('renders with tablist role', () => {
    render(<AnimatedTabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders tab count when provided', () => {
    const tabsWithCount = [{ id: 'tab1', label: 'Tab 1', count: 5 }];
    render(<AnimatedTabs tabs={tabsWithCount} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('SkipToContent', () => {
  it('renders skip link', () => {
    render(<SkipToContent />);
    expect(screen.getByText('Pular para o conteúdo principal')).toBeInTheDocument();
  });

  it('links to #main-content', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Pular para o conteúdo principal');
    expect(link).toHaveAttribute('href', '#main-content');
  });
});

describe('AccessibleMotion', () => {
  it('renders children', () => {
    render(<AccessibleMotion><span>Content</span></AccessibleMotion>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AccessibleMotion className="test-class"><span>Content</span></AccessibleMotion>);
    expect(container.querySelector('.test-class')).toBeInTheDocument();
  });
});

describe('LiveRegion', () => {
  it('renders message with polite mode by default', () => {
    render(<LiveRegion message="Item saved" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Item saved');
  });

  it('renders with assertive mode', () => {
    render(<LiveRegion message="Error occurred" type="assertive" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('has sr-only class for screen readers', () => {
    const { container } = render(<LiveRegion message="Test" />);
    expect(container.querySelector('.sr-only')).toBeInTheDocument();
  });
});
