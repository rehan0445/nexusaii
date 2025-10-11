# Vibe Header Component

A comprehensive header component for the Vibe chat application with advanced search and filter functionality.

## Features

### 🎨 Visual Design
- **Dark theme** consistent with the Vibe brand
- **Royal purple accent color** (#6A0DAD) for the "Vibe" brand text
- **Smooth animations** for opening/closing search and filter panels
- **Responsive design** that works on mobile devices
- **Clean, modern UI** following mobile app design patterns

### 🔍 Search Functionality
- **Full-screen search overlay** that slides down from the top
- **Search input field** with placeholder: "Search AI characters, genres, or..."
- **Recent searches section** with clickable history items
- **Keyboard navigation** support (Escape to close)
- **Auto-focus** on search input when opened

### 🎯 Filter Functionality
- **Bottom slide-up panel** with dark background and rounded corners
- **Tag search** within the filter panel: "Search tags..."
- **Multi-select checkboxes** for various filter categories
- **Filter count indicator** on the filter button
- **Clear all and apply** actions
- **Scrollable filter list** with grid layout

### 📱 Mobile-First Design
- **Touch-friendly sizing** for mobile interaction
- **Proper contrast** for accessibility
- **Backdrop blur effects** for modern feel
- **Smooth transitions** and animations

## Component Structure

```
VibeHeader/
├── Main Header
│   ├── Left: Vibe brand text (royal purple)
│   └── Right: Search and Filter buttons
├── Search Overlay (full-screen)
│   ├── Header with back button
│   ├── Search input with icon
│   └── Recent searches list
└── Filter Panel (bottom slide-up)
    ├── Header with close button
    ├── Tag search input
    ├── Filter categories grid
    └── Action buttons (Clear All, Apply)
```

## Usage

### Basic Implementation

```tsx
import VibeHeader from './components/vibe/VibeHeader';

function App() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Implement your search logic here
  };

  const handleFilterChange = (filters: string[]) => {
    console.log('Selected filters:', filters);
    setSelectedFilters(filters);
    // Implement your filter logic here
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <VibeHeader
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
      />
      {/* Your content here */}
    </div>
  );
}
```

### With Navigation Integration

```tsx
import VibeNavigation from './components/vibe/VibeNavigation';

function App() {
  const [activeSection, setActiveSection] = useState('chats');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <VibeNavigation
        activeSection={activeSection}
        onChangeSection={setActiveSection}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
      />
      {/* Your content here */}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSearch` | `(query: string) => void` | No | Callback when search is submitted |
| `onFilterChange` | `(filters: string[]) => void` | No | Callback when filters are changed |
| `selectedFilters` | `string[]` | No | Currently selected filter tags |
| `onMenuToggle` | `() => void` | No | Callback for mobile menu toggle |
| `isMenuOpen` | `boolean` | No | Whether mobile menu is open |

## Filter Categories

The component includes the following filter categories:

- **Gender**: Female, Male, Non-Binary
- **Roles**: Helper, VTuber, Sigma, Hunter, Warrior, Student, Advisor, Commander
- **Genres**: Demon Slayer, Science, Education, Career, Hololive
- **Specializations**: Bounty Hunter, Fighter, Knight

## Recent Searches

The search overlay displays recent searches including:
- Jotaro Kujo
- Mio Sakuraba
- shashank
- Eren Yeager
- Portgas D. Ace

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- **Colors**: Royal purple (#6A0DAD), zinc grays, gold accents
- **Typography**: Inter font family
- **Spacing**: Consistent padding and margins
- **Borders**: Subtle borders with zinc-800
- **Shadows**: Backdrop blur effects for overlays

## Accessibility

- **Keyboard navigation** support
- **ARIA labels** for screen readers
- **Focus management** for overlays
- **High contrast** ratios
- **Touch targets** sized appropriately for mobile

## Integration Examples

### Demo Component
See `VibeHeaderDemo.tsx` for a complete working example with state management.

### Chat Integration
See `ChatsExploreWithHeader.tsx` for integration with the existing chat functionality.

## Customization

### Adding New Filter Categories

```tsx
// In VibeHeader.tsx, update the filterCategories array:
const filterCategories = [
  'Female', 'Male', 'Helper', 'VTuber', 'Sigma', 'Hunter',
  'Non-Binary', 'Hololive', 'Education', 'Warrior',
  'Science', 'Student', 'Advisor', 'Bounty Hunter',
  'Career', 'Commander', 'Demon Slayer', 'Fighter', 'Knight',
  // Add your new categories here
  'YourNewCategory'
];
```

### Customizing Colors

```tsx
// Update the royal purple color in the component:
className="text-[#6A0DAD]" // or your custom color
```

### Modifying Recent Searches

```tsx
// In VibeHeader.tsx, update the recentSearches array:
const recentSearches = [
  'Your Custom Search 1',
  'Your Custom Search 2',
  // ... more searches
];
```

## Performance Considerations

- **Memoized filtering** for large datasets
- **Debounced search** input (can be added)
- **Virtual scrolling** for large filter lists (can be implemented)
- **Lazy loading** of search results

## Browser Support

- **Modern browsers** with ES6+ support
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **Progressive enhancement** for older browsers

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- React Router (for navigation integration)

## Future Enhancements

- [ ] Voice search capability
- [ ] Advanced filter combinations
- [ ] Search suggestions/autocomplete
- [ ] Filter presets
- [ ] Search analytics
- [ ] Offline search support
