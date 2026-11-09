import { lazy, type ComponentType } from 'react';
import {
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const AccordionDemo = lazyPage(() =>
  import('./demos/accordion').then(({ AccordionDemo }) => AccordionDemo),
);
const AlertDemo = lazyPage(() =>
  import('./demos/alert').then(({ AlertDemo }) => AlertDemo),
);
const AlertDialogDemo = lazyPage(() =>
  import('./demos/alert-dialog').then(({ AlertDialogDemo }) => AlertDialogDemo),
);
const AspectRatioDemo = lazyPage(() =>
  import('./demos/aspect-ratio').then(({ AspectRatioDemo }) => AspectRatioDemo),
);
const AvatarDemo = lazyPage(() =>
  import('./demos/avatar').then(({ AvatarDemo }) => AvatarDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const BreadcrumbDemo = lazyPage(() =>
  import('./demos/breadcrumb').then(({ BreadcrumbDemo }) => BreadcrumbDemo),
);
const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const ButtonGroupDemo = lazyPage(() =>
  import('./demos/button-group').then(({ ButtonGroupDemo }) => ButtonGroupDemo),
);
const CalendarDemo = lazyPage(() =>
  import('./demos/calendar').then(({ CalendarDemo }) => CalendarDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const CarouselDemo = lazyPage(() =>
  import('./demos/carousel').then(({ CarouselDemo }) => CarouselDemo),
);
const ChartDemo = lazyPage(() =>
  import('./demos/chart').then(({ ChartDemo }) => ChartDemo),
);
const CheckboxDemo = lazyPage(() =>
  import('./demos/checkbox').then(({ CheckboxDemo }) => CheckboxDemo),
);
const CollapsibleDemo = lazyPage(() =>
  import('./demos/collapsible').then(({ CollapsibleDemo }) => CollapsibleDemo),
);
const CommandDemo = lazyPage(() =>
  import('./demos/command').then(({ CommandDemo }) => CommandDemo),
);
const ContextMenuDemo = lazyPage(() =>
  import('./demos/context-menu').then(({ ContextMenuDemo }) => ContextMenuDemo),
);
const DialogDemo = lazyPage(() =>
  import('./demos/dialog').then(({ DialogDemo }) => DialogDemo),
);
const DrawerDemo = lazyPage(() =>
  import('./demos/drawer').then(({ DrawerDemo }) => DrawerDemo),
);
const DropdownMenuDemo = lazyPage(() =>
  import('./demos/dropdown-menu').then(
    ({ DropdownMenuDemo }) => DropdownMenuDemo,
  ),
);
const EmptyDemo = lazyPage(() =>
  import('./demos/empty').then(({ EmptyDemo }) => EmptyDemo),
);
const FieldDemo = lazyPage(() =>
  import('./demos/field').then(({ FieldDemo }) => FieldDemo),
);
const FormDemo = lazyPage(() =>
  import('./demos/form').then(({ FormDemo }) => FormDemo),
);
const HoverCardDemo = lazyPage(() =>
  import('./demos/hover-card').then(({ HoverCardDemo }) => HoverCardDemo),
);
const InputDemo = lazyPage(() =>
  import('./demos/input').then(({ InputDemo }) => InputDemo),
);
const InputGroupDemo = lazyPage(() =>
  import('./demos/input-group').then(({ InputGroupDemo }) => InputGroupDemo),
);
const InputOtpDemo = lazyPage(() =>
  import('./demos/input-otp').then(({ InputOtpDemo }) => InputOtpDemo),
);
const ItemDemo = lazyPage(() =>
  import('./demos/item').then(({ ItemDemo }) => ItemDemo),
);
const KbdDemo = lazyPage(() =>
  import('./demos/kbd').then(({ KbdDemo }) => KbdDemo),
);
const MenubarDemo = lazyPage(() =>
  import('./demos/menubar').then(({ MenubarDemo }) => MenubarDemo),
);
const NavigationMenuDemo = lazyPage(() =>
  import('./demos/navigation-menu').then(
    ({ NavigationMenuDemo }) => NavigationMenuDemo,
  ),
);
const PaginationDemo = lazyPage(() =>
  import('./demos/pagination').then(({ PaginationDemo }) => PaginationDemo),
);
const PopoverDemo = lazyPage(() =>
  import('./demos/popover').then(({ PopoverDemo }) => PopoverDemo),
);
const ProgressDemo = lazyPage(() =>
  import('./demos/progress').then(({ ProgressDemo }) => ProgressDemo),
);
const RadioGroupDemo = lazyPage(() =>
  import('./demos/radio-group').then(({ RadioGroupDemo }) => RadioGroupDemo),
);
const ResizableDemo = lazyPage(() =>
  import('./demos/resizable').then(({ ResizableDemo }) => ResizableDemo),
);
const ScrollAreaDemo = lazyPage(() =>
  import('./demos/scroll-area').then(({ ScrollAreaDemo }) => ScrollAreaDemo),
);
const SelectDemo = lazyPage(() =>
  import('./demos/select').then(({ SelectDemo }) => SelectDemo),
);
const SeparatorDemo = lazyPage(() =>
  import('./demos/separator').then(({ SeparatorDemo }) => SeparatorDemo),
);
const SheetDemo = lazyPage(() =>
  import('./demos/sheet').then(({ SheetDemo }) => SheetDemo),
);
const SidebarDemo = lazyPage(() =>
  import('./demos/sidebar').then(({ SidebarDemo }) => SidebarDemo),
);
const SkeletonDemo = lazyPage(() =>
  import('./demos/skeleton').then(({ SkeletonDemo }) => SkeletonDemo),
);
const SliderDemo = lazyPage(() =>
  import('./demos/slider').then(({ SliderDemo }) => SliderDemo),
);
const SonnerDemo = lazyPage(() =>
  import('./demos/sonner').then(({ SonnerDemo }) => SonnerDemo),
);
const SpinnerDemo = lazyPage(() =>
  import('./demos/spinner').then(({ SpinnerDemo }) => SpinnerDemo),
);
const SwitchDemo = lazyPage(() =>
  import('./demos/switch').then(({ SwitchDemo }) => SwitchDemo),
);
const TableDemo = lazyPage(() =>
  import('./demos/table').then(({ TableDemo }) => TableDemo),
);
const TabsDemo = lazyPage(() =>
  import('./demos/tabs').then(({ TabsDemo }) => TabsDemo),
);
const TextareaDemo = lazyPage(() =>
  import('./demos/textarea').then(({ TextareaDemo }) => TextareaDemo),
);
const ToastDemo = lazyPage(() =>
  import('./demos/toast').then(({ ToastDemo }) => ToastDemo),
);
const ToggleDemo = lazyPage(() =>
  import('./demos/toggle').then(({ ToggleDemo }) => ToggleDemo),
);
const ToggleGroupDemo = lazyPage(() =>
  import('./demos/toggle-group').then(({ ToggleGroupDemo }) => ToggleGroupDemo),
);
const TooltipDemo = lazyPage(() =>
  import('./demos/tooltip').then(({ TooltipDemo }) => TooltipDemo),
);

// The Brightside Project-specific demos
const WaveDividerDemo = lazyPage(() =>
  import('./demos/wave-divider').then(({ WaveDividerDemo }) => WaveDividerDemo),
);

export type PreviewEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = {
  name: string;
  entries: PreviewEntry[];
};

export const DESIGN_SYSTEM = {
  title: 'The Brightside Project Design System',
  description:
    'Warm boho wellness — earthy terracotta, sage green, and amber with editorial serif type for The Brightside Project student mental wellness platform.',
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: 'overview',
  name: 'Overview',
  description: 'The visual foundations and principles that shape The Brightside Project.',
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Brand',
    entries: [
      {
        id: 'brand-palette',
        name: 'Palette',
        description: 'The earthy botanical palette: terracotta, sage, amber, and dusty rose.',
        Page: ColorsPage,
      },
    ],
  },
  {
    name: 'Fonts',
    entries: [
      {
        id: 'type-scale',
        name: 'Type scale',
        description: 'Cormorant Garamond display, Nunito body, Caveat handwritten accent.',
        Page: FontsPage,
      },
    ],
  },
  {
    name: 'Layout',
    entries: [
      {
        id: 'spacing-radius',
        name: 'Spacing and radius',
        description: 'Generous 20px base radius and 4px spacing step.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'Actions',
    entries: [
      {
        id: 'button',
        name: 'Buttons',
        description: 'Pill-shaped buttons in terracotta, sage, amber, ghost, and link variants.',
        Page: ButtonDemo,
      },
      {
        id: 'button-group',
        name: 'Button group',
        description: 'Attached actions, labels, and separators.',
        Page: ButtonGroupDemo,
      },
      {
        id: 'toggle',
        name: 'Toggle',
        description: 'Pressed controls in multiple variants and sizes.',
        Page: ToggleDemo,
      },
      {
        id: 'toggle-group',
        name: 'Toggle group',
        description: 'Single and multiple selection toggle sets.',
        Page: ToggleGroupDemo,
      },
    ],
  },
  {
    name: 'Forms & inputs',
    entries: [
      {
        id: 'input',
        name: 'Input',
        description: 'Warm-toned text inputs with boho rounding and earthy focus ring.',
        Page: InputDemo,
      },
      {
        id: 'input-group',
        name: 'Input group',
        description: 'Inputs with inline and block addons.',
        Page: InputGroupDemo,
      },
      {
        id: 'input-otp',
        name: 'Input OTP',
        description: 'Segmented one-time code entry.',
        Page: InputOtpDemo,
      },
      {
        id: 'textarea',
        name: 'Textarea',
        description: 'Multiline text entry — used for journal prompts and message forms.',
        Page: TextareaDemo,
      },
      {
        id: 'checkbox',
        name: 'Checkbox',
        description: 'Checked, unchecked, and disabled options.',
        Page: CheckboxDemo,
      },
      {
        id: 'radio-group',
        name: 'Radio group',
        description: 'Exclusive choices with labels and disabled states.',
        Page: RadioGroupDemo,
      },
      {
        id: 'select',
        name: 'Select',
        description: 'Selection controls — used for mood and activity dropdowns.',
        Page: SelectDemo,
      },
      {
        id: 'slider',
        name: 'Slider',
        description: 'Single values and ranges.',
        Page: SliderDemo,
      },
      {
        id: 'switch',
        name: 'Switch',
        description: 'Binary preference controls and states.',
        Page: SwitchDemo,
      },
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Single-date calendar.',
        Page: CalendarDemo,
      },
      {
        id: 'field',
        name: 'Field',
        description: 'Labels, descriptions, errors, and grouped fields.',
        Page: FieldDemo,
      },
      {
        id: 'form',
        name: 'Form',
        description: 'Validated form composition.',
        Page: FormDemo,
      },
    ],
  },
  {
    name: 'Overlays',
    entries: [
      {
        id: 'dialog',
        name: 'Dialog',
        description: 'Modal content with header, footer, and actions.',
        Page: DialogDemo,
      },
      {
        id: 'alert-dialog',
        name: 'Alert dialog',
        description: 'Confirmation for consequential actions.',
        Page: AlertDialogDemo,
      },
      {
        id: 'sheet',
        name: 'Sheet',
        description: 'Edge-aligned overlay panels.',
        Page: SheetDemo,
      },
      {
        id: 'drawer',
        name: 'Drawer',
        description: 'Touch-friendly bottom overlay.',
        Page: DrawerDemo,
      },
      {
        id: 'popover',
        name: 'Popover',
        description: 'Anchored interactive content.',
        Page: PopoverDemo,
      },
      {
        id: 'hover-card',
        name: 'Hover card',
        description: 'Rich context revealed on hover.',
        Page: HoverCardDemo,
      },
      {
        id: 'tooltip',
        name: 'Tooltip',
        description: 'Brief labels for focused or hovered controls.',
        Page: TooltipDemo,
      },
      {
        id: 'command',
        name: 'Command',
        description: 'Searchable keyboard-first command lists.',
        Page: CommandDemo,
      },
    ],
  },
  {
    name: 'Menus & navigation',
    entries: [
      {
        id: 'dropdown-menu',
        name: 'Dropdown menu',
        description: 'Actions, choices, shortcuts, and submenus.',
        Page: DropdownMenuDemo,
      },
      {
        id: 'context-menu',
        name: 'Context menu',
        description: 'Right-click actions.',
        Page: ContextMenuDemo,
      },
      {
        id: 'menubar',
        name: 'Menubar',
        description: 'Desktop-style application menus.',
        Page: MenubarDemo,
      },
      {
        id: 'navigation-menu',
        name: 'Navigation menu',
        description: 'Primary navigation with rich flyouts.',
        Page: NavigationMenuDemo,
      },
      {
        id: 'breadcrumb',
        name: 'Breadcrumb',
        description: 'Hierarchical location and parent links.',
        Page: BreadcrumbDemo,
      },
      {
        id: 'pagination',
        name: 'Pagination',
        description: 'Previous, next, page, and overflow controls.',
        Page: PaginationDemo,
      },
      {
        id: 'tabs',
        name: 'Tabs',
        description: 'Switch between related content views.',
        Page: TabsDemo,
      },
      {
        id: 'sidebar',
        name: 'Sidebar',
        description: 'Bounded application navigation.',
        Page: SidebarDemo,
      },
    ],
  },
  {
    name: 'Data display',
    entries: [
      {
        id: 'avatar',
        name: 'Avatar',
        description: 'Profile images, fallbacks, and sizes.',
        Page: AvatarDemo,
      },
      {
        id: 'badge',
        name: 'Badge',
        description: 'Pill status chips in earthy palette colors — mood, category, status.',
        Page: BadgeDemo,
      },
      {
        id: 'card',
        name: 'Card',
        description: 'Generously rounded warm-beige cards with soft borders.',
        Page: CardDemo,
      },
      {
        id: 'table',
        name: 'Table',
        description: 'Structured tabular data.',
        Page: TableDemo,
      },
      {
        id: 'accordion',
        name: 'Accordion',
        description: 'Expandable sections — used in Resources.',
        Page: AccordionDemo,
      },
      {
        id: 'collapsible',
        name: 'Collapsible',
        description: 'Compact expandable content region.',
        Page: CollapsibleDemo,
      },
      {
        id: 'carousel',
        name: 'Carousel',
        description: 'Keyboard-accessible paged content.',
        Page: CarouselDemo,
      },
      {
        id: 'item',
        name: 'Item',
        description: 'Flexible rows with media, metadata, and actions.',
        Page: ItemDemo,
      },
      {
        id: 'empty',
        name: 'Empty state',
        description: 'Guidance when content is absent.',
        Page: EmptyDemo,
      },
      {
        id: 'kbd',
        name: 'Keyboard key',
        description: 'Keyboard shortcuts.',
        Page: KbdDemo,
      },
      {
        id: 'aspect-ratio',
        name: 'Aspect ratio',
        description: 'Proportional media containers.',
        Page: AspectRatioDemo,
      },
    ],
  },
  {
    name: 'Feedback',
    entries: [
      {
        id: 'alert',
        name: 'Alert',
        description: 'Informational and destructive messages.',
        Page: AlertDemo,
      },
      {
        id: 'progress',
        name: 'Progress',
        description: 'Completion indicators.',
        Page: ProgressDemo,
      },
      {
        id: 'skeleton',
        name: 'Skeleton',
        description: 'Loading placeholder shapes.',
        Page: SkeletonDemo,
      },
      {
        id: 'spinner',
        name: 'Spinner',
        description: 'Indeterminate loading indicators.',
        Page: SpinnerDemo,
      },
      {
        id: 'toast',
        name: 'Toast',
        description: 'Transient notifications.',
        Page: ToastDemo,
      },
      {
        id: 'sonner',
        name: 'Sonner',
        description: 'Stacked notifications with status.',
        Page: SonnerDemo,
      },
    ],
  },
  {
    name: 'Structure',
    entries: [
      {
        id: 'separator',
        name: 'Separator',
        description: 'Horizontal and vertical dividers.',
        Page: SeparatorDemo,
      },
      {
        id: 'scroll-area',
        name: 'Scroll area',
        description: 'Bounded scrolling regions.',
        Page: ScrollAreaDemo,
      },
      {
        id: 'resizable',
        name: 'Resizable panels',
        description: 'Split panes with draggable handles.',
        Page: ResizableDemo,
      },
    ],
  },
  {
    name: 'The Brightside Project',
    entries: [
      {
        id: 'wave-divider',
        name: 'Wave divider',
        description: 'Organic SVG wave/hills section dividers — the earthy green footer signature.',
        Page: WaveDividerDemo,
      },
    ],
  },
  {
    name: 'Charts',
    entries: [
      {
        id: 'chart',
        name: 'Chart',
        description: 'Data visualization with the earthy palette.',
        Page: ChartDemo,
      },
    ],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [
  OVERVIEW_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(
      ', ',
    )}. Every page id must be unique across all nav groups.`,
  );
}
