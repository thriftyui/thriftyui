import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { ChevronsUpDown, Play, Plus, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'thriftyui/alert-dialog'
import { Button } from 'thriftyui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'thriftyui/hover-card'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from 'thriftyui/popover'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from 'thriftyui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'thriftyui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'thriftyui/accordion'
import { AccessibleIcon, AspectRatio } from 'thriftyui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from 'thriftyui/avatar'
import { Checkbox } from 'thriftyui/checkbox'
import { Form, FormControl, FormField, FormLabel, FormMessage, FormSubmit } from 'thriftyui/form'
import { OneTimePasswordField, OneTimePasswordFieldHiddenInput, OneTimePasswordFieldInput } from 'thriftyui/one-time-password-field'
import { PasswordToggleField, PasswordToggleFieldInput, PasswordToggleFieldToggle } from 'thriftyui/password-toggle-field'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'thriftyui/collapsible'
import { Progress } from 'thriftyui/progress'
import { ScrollArea } from 'thriftyui/scroll-area'
import { Separator } from 'thriftyui/separator'
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from 'thriftyui/toast'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from 'thriftyui/context-menu'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'thriftyui/dropdown-menu'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from 'thriftyui/menubar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'thriftyui/navigation-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from 'thriftyui/select'
import { Input } from 'thriftyui/input'
import { Label } from 'thriftyui/label'
import { RadioGroup, RadioGroupItem } from 'thriftyui/radio-group'
import { Slider } from 'thriftyui/slider'
import { Switch } from 'thriftyui/switch'
import { Textarea } from 'thriftyui/textarea'
import { Badge } from 'thriftyui/badge'
import { SegmentedControl } from 'thriftyui/segmented-control'
import { useSettings } from '../settings'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from 'thriftyui/breadcrumb'
import { Combobox } from 'thriftyui/combobox'
import { Meter } from 'thriftyui/meter'
import { pageRange } from 'thriftyui/page-range'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from 'thriftyui/pagination'

// The kit's ordinary components, each in a card with its name. Light or
// dark by the Dark toggle in the page's header.

function Card({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`card-${name}`} className="flex flex-col gap-4 rounded-lg border border-neutral-6 p-5">
      <h2 id={`card-${name}`} className="text-sm font-semibold text-neutral-12">
        {name}
      </h2>
      {children}
    </section>
  )
}

function DropdownDemo() {
  const [ruler, setRuler] = useState(true)
  const [size, setSize] = useState('m')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="self-start">Open the menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Edit</DropdownMenuLabel>
        <DropdownMenuItem>
          Copy <DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Paste <DropdownMenuShortcut>Ctrl V</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Undo</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={ruler} onCheckedChange={(c) => setRuler(c === true)}>
          Show the ruler
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel inset>Text size</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={size} onValueChange={setSize}>
          <DropdownMenuRadioItem value="s">Small</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="m">Medium</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="l">Large</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Copy the link</DropdownMenuItem>
            <DropdownMenuItem>Email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ToastDemo() {
  const [open, setOpen] = useState(false)
  return (
    <ToastProvider>
      <Button
        className="self-start"
        onClick={() => {
          setOpen(false)
          // Closed first, so pressing again shows it again.
          window.setTimeout(() => setOpen(true), 50)
        }}
      >
        Show a toast
      </Button>
      <Toast open={open} onOpenChange={setOpen}>
        <div className="flex flex-col gap-1">
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes are kept.</ToastDescription>
        </div>
        <ToastAction altText="Undo from the Edit menu">Undo</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}

function ProgressDemo() {
  const [value, setValue] = useState(3)
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Progress aria-label="Upload" value={value} max={10} />
      <p className="text-sm text-neutral-11">{value} of 10</p>
      <div className="flex gap-2">
        <Button onClick={() => setValue((v) => Math.max(0, v - 1))}>Less</Button>
        <Button onClick={() => setValue((v) => Math.min(10, v + 1))}>More</Button>
      </div>
      <Progress aria-label="Loading" value={null} />
      <p className="text-sm text-neutral-11">Length unknown</p>
    </div>
  )
}

function FormDemo() {
  const [sent, setSent] = useState(false)
  return (
    <Form
      className="max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <FormField name="email">
        <FormLabel>Email</FormLabel>
        <FormControl type="email" required placeholder="ada@example.com" />
        <FormMessage match="valueMissing">Enter your email.</FormMessage>
        <FormMessage match="typeMismatch">That is not an email address.</FormMessage>
      </FormField>
      <FormField name="password">
        <FormLabel>Password</FormLabel>
        {/* The field's control, so its label names it and its messages
            describe it (Radix's Form.Control, asChild). */}
        <PasswordToggleField>
          <FormControl asChild>
            <PasswordToggleFieldInput required minLength={8} />
          </FormControl>
          <PasswordToggleFieldToggle />
        </PasswordToggleField>
        <FormMessage match="valueMissing">Choose a password.</FormMessage>
        <FormMessage match="tooShort">At least eight characters.</FormMessage>
      </FormField>
      <FormSubmit className="self-start">Sign up</FormSubmit>
      {sent && (
        <p role="status" className="text-sm text-neutral-11">
          Signed up.
        </p>
      )}
    </Form>
  )
}

const STATES = ['Alabama', 'Alaska', 'American Samoa', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Guam', 'Hawaii'].map(
  (label) => ({ value: label.toLowerCase().replace(/ /g, '-'), label, disabled: label === 'Guam' }),
)

function PaginationDemo() {
  const [page, setPage] = useState(6)
  const total = 12
  // The demo's pages are not addresses, so each link changes the page here.
  const go = (p: number) => (e: MouseEvent) => {
    e.preventDefault()
    setPage(p)
  }
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={page > 1 ? `#page-${page - 1}` : undefined} onClick={go(page - 1)} />
        </PaginationItem>
        {pageRange(page, total).map((p, i) => (
          <PaginationItem key={i}>
            {p === 'gap' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={`#page-${p}`} current={p === page} onClick={go(p)}>
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={page < total ? `#page-${page + 1}` : undefined} onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// The theme, from thriftyui/themes.css: the accent's scale, the neutral's,
// and the corners, set on the page's root so the whole app shows them.
const ACCENTS = ['amber', 'blue', 'bronze', 'brown', 'crimson', 'cyan', 'gold', 'grass', 'green', 'indigo', 'iris', 'jade', 'lime', 'mint', 'orange', 'pink', 'plum', 'purple', 'red', 'ruby', 'sky', 'teal', 'tomato', 'violet', 'yellow']
const NEUTRALS = ['gray', 'mauve', 'slate', 'sage', 'olive', 'sand']
const RADII = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const
type Radius = (typeof RADII)[number]['value']
const title = (s: string) => s[0].toUpperCase() + s.slice(1)

function useRootAttribute<T extends string>(name: string, fallback: T) {
  const [value, setValue] = useState<T>(() => (document.documentElement.getAttribute(name) as T | null) ?? fallback)
  useEffect(() => {
    document.documentElement.setAttribute(name, value)
  }, [name, value])
  return [value, setValue] as const
}

function ThemeChoices() {
  const { dir, setDir } = useSettings()
  const [accent, setAccent] = useRootAttribute<string>('data-accent', 'blue')
  const [neutral, setNeutral] = useRootAttribute<string>('data-neutral', 'gray')
  const [radius, setRadius] = useRootAttribute<Radius>('data-radius', 'medium')
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme-accent">Accent</Label>
          <Select value={accent} onValueChange={setAccent}>
            <SelectTrigger id="theme-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCENTS.map((a) => (
                <SelectItem key={a} value={a}>
                  {title(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme-neutral">Neutral</Label>
          <Select value={neutral} onValueChange={setNeutral}>
            <SelectTrigger id="theme-neutral">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEUTRALS.map((n) => (
                <SelectItem key={n} value={n}>
                  {title(n)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Corners</span>
        <SegmentedControl label="Corners" value={radius} options={[...RADII]} onChange={setRadius} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Direction</span>
        <SegmentedControl
          label="Direction"
          value={dir}
          options={[
            { value: 'ltr', label: 'Left to right' },
            { value: 'rtl', label: 'Right to left' },
          ]}
          onChange={setDir}
        />
      </div>
    </div>
  )
}

export function ComponentsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
      <p className="text-neutral-11">The ordinary components, built on Radix and HTML, in the kit's cell style.</p>

      <Card name="Theme">
        <ThemeChoices />
      </Card>

      <Card name="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="solid">Solid</Button>
          <Button variant="ghost">Ghost</Button>
          <Button>
            <Plus aria-hidden strokeWidth={1.75} />
            With an icon
          </Button>
          <Button size="icon" aria-label="Close">
            <X aria-hidden strokeWidth={1.75} />
          </Button>
          <Button disabled>Disabled</Button>
          <Button asChild variant="ghost">
            <a href="#card-Button">As a link</a>
          </Button>
        </div>
      </Card>

      <Card name="Label and Input">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="demo-name">Name</Label>
          <Input id="demo-name" placeholder="Ada Lovelace" />
        </div>
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="demo-off">Disabled</Label>
          <Input id="demo-off" disabled placeholder="Not now" />
        </div>
      </Card>

      <Card name="Textarea">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="demo-notes">Notes</Label>
          <Textarea id="demo-notes" placeholder="Several lines" />
        </div>
      </Card>

      <Card name="Checkbox">
        <div className="flex flex-col gap-3">
          {[
            { id: 'demo-cb-1', label: 'Unchecked', checked: false },
            { id: 'demo-cb-2', label: 'Checked', checked: true },
            { id: 'demo-cb-3', label: 'In between', checked: 'indeterminate' as const },
          ].map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox id={c.id} defaultChecked={c.checked} />
              <Label htmlFor={c.id}>{c.label}</Label>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Checkbox id="demo-cb-4" disabled />
            <Label htmlFor="demo-cb-4" className="text-neutral-8">
              Disabled
            </Label>
          </div>
        </div>
      </Card>

      <Card name="Radio Group">
        <RadioGroup aria-label="Size" defaultValue="m">
          {[
            { v: 's', l: 'Small' },
            { v: 'm', l: 'Medium' },
            { v: 'l', l: 'Large' },
          ].map((o) => (
            <div key={o.v} className="flex items-center gap-2">
              <RadioGroupItem value={o.v} id={`demo-size-${o.v}`} />
              <Label htmlFor={`demo-size-${o.v}`}>{o.l}</Label>
            </div>
          ))}
        </RadioGroup>
      </Card>

      <Card name="Switch">
        <div className="flex items-center gap-2">
          <Switch id="demo-switch" defaultChecked />
          <Label htmlFor="demo-switch">Notifications</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="demo-switch-off" disabled />
          <Label htmlFor="demo-switch-off" className="text-neutral-8">
            Disabled
          </Label>
        </div>
      </Card>

      <Card name="Slider">
        <div className="flex max-w-sm flex-col gap-6">
          <Slider aria-label="Volume" defaultValue={[40]} />
          <Slider aria-label="Price" defaultValue={[20, 80]} />
        </div>
      </Card>

      <Card name="Popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="self-start">Open a popover</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Dimensions" className="flex flex-col gap-3">
            <p className="text-sm font-medium">Dimensions</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="demo-width">Width</Label>
              <Input id="demo-width" defaultValue="100%" />
            </div>
            <PopoverClose asChild>
              <Button variant="solid" className="self-end">
                Done
              </Button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      </Card>

      <Card name="Hover Card">
        <p className="text-sm text-neutral-11">
          Rest the pointer on{' '}
          <HoverCard openDelay={300}>
            <HoverCardTrigger href="#card-Hover Card" className="font-medium text-accent-12 underline underline-offset-2">
              Ada Lovelace
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
              <p className="font-semibold">Ada Lovelace</p>
              <p className="mt-1 text-neutral-11">Wrote the first program, for Babbage's Analytical Engine.</p>
            </HoverCardContent>
          </HoverCard>{' '}
          to preview her.
        </p>
      </Card>

      <Card name="Tooltip">
        <TooltipProvider delayDuration={300}>
          <div className="flex gap-3">
            {['Bold', 'Italic', 'Underline'].map((t) => (
              <Tooltip key={t}>
                <TooltipTrigger asChild>
                  <Button size="icon" aria-label={t}>
                    {t[0]}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </Card>

      <Card name="Alert Dialog">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger" className="self-start">
              Delete the project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete the project?</AlertDialogTitle>
            <AlertDialogDescription>Its files go with it, and it cannot be brought back.</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="danger">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      <Card name="Sheet">
        <div className="flex flex-wrap gap-3">
          {(['left', 'right', 'top', 'bottom'] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button>From the {side}</Button>
              </SheetTrigger>
              <SheetContent side={side} className="gap-2 p-5">
                <SheetTitle className="text-base font-semibold">A sheet</SheetTitle>
                <SheetDescription className="text-sm text-neutral-11">It slid in from the {side}.</SheetDescription>
                <SheetClose asChild>
                  <Button className="mt-2 self-start">Close</Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </Card>

      <Card name="Dropdown Menu">
        <DropdownDemo />
      </Card>

      <Card name="Context Menu">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-28 items-center justify-center rounded-md border border-dashed border-neutral-7 text-sm text-neutral-11">
            Right-click, or long-press, here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuItem>Duplicate</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-danger-11">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Card>

      <Card name="Menubar">
        <Menubar aria-label="Application" className="self-start rounded-md bg-neutral-2">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>Ctrl N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Close</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Zoom in</MenubarItem>
              <MenubarItem>Zoom out</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Card>

      <Card name="Select">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="demo-fruit">Fruit</Label>
          <Select>
            <SelectTrigger id="demo-fruit">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruit</SelectLabel>
                {['Apple', 'Banana', 'Cherry', 'Pear'].map((f) => (
                  <SelectItem key={f} value={f.toLowerCase()}>
                    {f}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Vegetables</SelectLabel>
                {['Carrot', 'Leek'].map((f) => (
                  <SelectItem key={f} value={f.toLowerCase()}>
                    {f}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card name="Combobox">
        <div className="flex max-w-sm flex-col gap-2">
          <Label id="demo-state-label" htmlFor="demo-state">
            State
          </Label>
          <Combobox id="demo-state" label="State" aria-labelledby="demo-state-label" options={STATES} placeholder="Type a name" />
          <p className="text-xs text-neutral-11">Guam cannot be chosen.</p>
        </div>
      </Card>

      <Card name="Navigation Menu">
        <NavigationMenu aria-label="Example site" className="self-start rounded-md bg-neutral-2">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#card-Navigation Menu" active>
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex w-56 flex-col">
                  {['Guides', 'Examples', 'Reference'].map((l) => (
                    <li key={l}>
                      <NavigationMenuLink href="#card-Navigation Menu">
                        {l}
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#card-Navigation Menu">Blog</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Card>

      <Card name="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#card-Breadcrumb">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#card-Breadcrumb">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Sound</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Card>

      <Card name="Pagination">
        <PaginationDemo />
      </Card>

      <Card name="Accordion">
        <Accordion type="single" collapsible className="max-w-md">
          {[
            ['Shipping', 'Three to five working days.'],
            ['Returns', 'Within thirty days, in the box it came in.'],
            ['Warranty', 'Two years, parts and labour.'],
          ].map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card name="Collapsible">
        <Collapsible className="flex max-w-md flex-col gap-2">
          <CollapsibleTrigger asChild>
            <Button className="self-start">
              <ChevronsUpDown aria-hidden strokeWidth={1.75} />
              Three more
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="flex flex-col gap-1 text-sm text-neutral-11">
              <li>Second</li>
              <li>Third</li>
              <li>Fourth</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card name="Avatar">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23cbd5e1'/%3E%3C/svg%3E" alt="A gray square" />
            <AvatarFallback>GS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/no-such-picture.png" alt="Ada Lovelace" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <span className="text-sm text-neutral-11">A picture, and initials where one could not load</span>
        </div>
      </Card>

      <Card name="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Draft</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="danger">Overdue</Badge>
        </div>
      </Card>

      <Card name="Progress">
        <ProgressDemo />
      </Card>

      <Card name="Meter">
        <div className="flex max-w-sm flex-col gap-4">
          <Meter label="Storage" value={41} max={64} valueText="41 of 64 GB" />
          <Meter label="Battery" value={72} valueText="72%" />
        </div>
      </Card>

      <Card name="Skip Link">
        <p className="text-sm text-neutral-11">
          The first stop on every page: press Tab from the top of the window, and it shows at the top left, taking focus past the header and the
          columns to the page.
        </p>
      </Card>

      <Card name="Separator">
        <div className="flex max-w-sm flex-col gap-3 text-sm">
          <p>Above</p>
          <Separator />
          <div className="flex h-5 items-center gap-3">
            <span>Left</span>
            <Separator orientation="vertical" />
            <span>Right</span>
          </div>
        </div>
      </Card>

      <Card name="Scroll Area">
        <ScrollArea aria-label="Thirty items" className="h-40 max-w-xs rounded-md border border-neutral-6">
          <ul className="p-3 text-sm">
            {Array.from({ length: 30 }, (_, i) => (
              <li key={i} className="py-1">
                Item {i + 1}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>

      <Card name="Toast">
        <ToastDemo />
      </Card>

      <Card name="Form and Password Toggle Field">
        <FormDemo />
      </Card>

      <Card name="One-Time Password Field">
        <div className="flex flex-col gap-2">
          <Label htmlFor="demo-otp-0">Code from the text message</Label>
          <OneTimePasswordField aria-label="Code from the text message">
            {Array.from({ length: 6 }, (_, i) => (
              <OneTimePasswordFieldInput key={i} id={i === 0 ? 'demo-otp-0' : undefined} />
            ))}
            <OneTimePasswordFieldHiddenInput name="code" />
          </OneTimePasswordField>
        </div>
      </Card>

      <Card name="Aspect Ratio and Accessible Icon">
        <div className="max-w-xs">
          <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-md bg-neutral-3">
            <Button size="icon" variant="solid">
              <AccessibleIcon label="Play">
                <Play strokeWidth={1.75} />
              </AccessibleIcon>
            </Button>
          </AspectRatio>
        </div>
      </Card>
    </div>
  )
}
