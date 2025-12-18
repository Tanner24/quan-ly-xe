# VINCONS UI STYLE GUIDE

## 📐 Chuẩn hóa UI Components

### 🎨 Color Palette
- **Primary Blue**: `bg-blue-600 hover:bg-blue-700`
- **Success Green**: `bg-green-600 hover:bg-green-700`
- **Danger Red**: `bg-red-600 hover:bg-red-700`
- **Warning Yellow**: `bg-yellow-500 hover:bg-yellow-600`

### 🔘 Buttons

#### Primary Action Button
```tsx
<Button className="bg-blue-600 hover:bg-blue-700">
    <Plus className="w-4 h-4 mr-2" />
    Button Text
</Button>
```

#### Secondary/Outline Button
```tsx
<Button variant="outline">
    <Icon className="w-4 h-4 mr-2" />
    Button Text
</Button>
```

#### Destructive Button
```tsx
<Button variant="destructive">
    <Trash2 className="w-4 h-4 mr-2" />
    Delete
</Button>
```

### 🎯 Icon Sizes
- **Small**: `w-4 h-4` (buttons, inline icons)
- **Medium**: `w-5 h-5` (list items)
- **Large**: `w-6 h-6` (headers, emphasis)
- **Extra Large**: `w-8 h-8` (page headers)

### 🔙 Back Link (Optional - use if navigating from another page)
```tsx
<Link href="/" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors cursor-pointer w-fit">
    <ArrowLeft className="h-4 w-4" />
    <span>Trở về</span>
</Link>
```

### 📄 Page Header Structure
```tsx
<div className="space-y-6">
    {/* Optional Back Link - only if needed */}
    <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors cursor-pointer w-fit">
        <ArrowLeft className="h-4 w-4" />
        <span>Trở về</span>
    </Link>

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Page Title</h1>
            <p className="text-gray-500 text-sm">Page description</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Primary Action
        </Button>
    </div>

    {/* Content */}
    ...
</div>
```

### 🏷️ Badges

#### Status Badges
```tsx
// Active/Success
<Badge className="bg-green-100 text-green-800">Active</Badge>

// Warning
<Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>

// Danger/Error
<Badge variant="destructive">Error</Badge>

// Info/Default
<Badge variant="outline">Info</Badge>
```

### 📊 Icon Colors by Context

#### Page Headers
- Dashboard: `text-blue-600`
- Reports: `text-purple-600`
- Vehicles: `text-green-600`
- Logs: `text-orange-600`
- Maintenance: `text-red-600`
- Settings: `text-gray-600`
- Technical: `text-indigo-600`

### 📝 Typography
- **Page Title**: `text-2xl font-bold tracking-tight text-gray-900`
- **Section Title**: `text-xl font-bold text-gray-800`
- **Subtitle**: `text-gray-500 text-sm`
- **Body**: `text-gray-700`

### 🚨 Empty States
```tsx
<div className="text-center py-12 bg-white rounded-lg border border-dashed">
    <Icon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
    <h3 className="text-lg font-medium text-gray-900">No items found</h3>
    <p className="text-gray-500 text-sm mt-1">Description text</p>
</div>
```

### ⏳ Loading States
```tsx
<div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-gray-600">Loading...</span>
</div>
```

---

## 🎯 Implementation Checklist

When creating/updating a page:
- [ ] Use standardized button styles
- [ ] Use consistent icon sizes (w-4 h-4 for buttons)
- [ ] Add back link ONLY if user navigated from another page
- [ ] Use appropriate icon colors for context
- [ ] Include empty state
- [ ] Include loading state
- [ ] Follow page header structure
