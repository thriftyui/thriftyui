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
import { ROW } from 'thriftyui/cell'
import { ColumnHeader } from 'thriftyui/column'
import { ColumnDrawerClose, ColumnDrawerContent } from 'thriftyui/column-drawer'
import { DialogHeader } from 'thriftyui/dialog'
import { ListDetail, ListDetailBack, ListDetailContent, ListDetailItem, ListDetailList, ListDetailTitle } from 'thriftyui/list-detail'
import { RadioGroup, RadioGroupRow } from 'thriftyui/radio-group'
import { FINISHES, THEMES, type FinishChoice, type Settings, type ThemeChoice } from './settings'

// Settings, in the left column's drawer: a list of what can be set, each
// with what it is set to now, each opening its own page with Back -- the
// kit's ListDetail -- and on each page the choices as the kit's Radio Group
// in rows: Theme and Finish. Then Close project, a row that acts, back to
// the start screen once confirmed in the kit's Alert Dialog: closing stops
// Claude Code (src-tauri/src/lib.rs, close_folder), so it asks first --
// Thrifty Builder's Close app (ThriftyUI's repository: builder/src/
// SettingsDrawer.tsx), its title in the kit's dialog header, no close
// button, as an alert dialog is answered.

const labelOf = <T extends string>(list: { value: T; label: string }[], value: T) => list.find((o) => o.value === value)?.label ?? value

export function SettingsDrawer({
  settings,
  onChange,
  onCloseProject,
}: {
  settings: Settings
  onChange: (next: Partial<Settings>) => void
  onCloseProject: () => void
}) {
  return (
    // Room for its header and the list's three rows, and one more, empty.
    <ColumnDrawerContent aria-label="Settings" rows={4} header>
      <ListDetail>
        <ColumnHeader>
          <ListDetailBack />
          <ListDetailTitle className="px-3">Settings</ListDetailTitle>
          <ColumnDrawerClose />
        </ColumnHeader>
        <ListDetailList aria-label="Settings">
          <ListDetailItem value="theme" summary={labelOf(THEMES, settings.theme)}>
            Theme
          </ListDetailItem>
          <ListDetailItem value="finish" summary={labelOf(FINISHES, settings.finish)}>
            Finish
          </ListDetailItem>
          <li>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className={ROW}>
                  Close project
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="gap-0 overflow-hidden p-0">
                <DialogHeader>
                  <AlertDialogTitle className="flex-1 self-center px-4 text-sm font-semibold">
                    <span className="pattern-text">Close this project?</span>
                  </AlertDialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 p-5">
                  <AlertDialogDescription>
                    Claude Code stops, and you go back to the start screen. The project's files stay as they are, and it stays in
                    Recent.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it open</AlertDialogCancel>
                    <AlertDialogAction onClick={onCloseProject}>Close project</AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        </ListDetailList>
        <Choices label="Theme" value="theme" list={THEMES} chosen={settings.theme} onChoose={(v) => onChange({ theme: v as ThemeChoice })} />
        <Choices label="Finish" value="finish" list={FINISHES} chosen={settings.finish} onChoose={(v) => onChange({ finish: v as FinishChoice })} />
      </ListDetail>
    </ColumnDrawerContent>
  )
}

/** A setting's page: its choices as rows. */
function Choices({
  label,
  value,
  list,
  chosen,
  onChoose,
}: {
  label: string
  value: string
  list: { value: string; label: string }[]
  chosen: string
  onChoose: (value: string) => void
}) {
  return (
    <ListDetailContent value={value}>
      <RadioGroup aria-label={label} value={chosen} onValueChange={onChoose} className="gap-0">
        {list.map((o) => (
          <RadioGroupRow key={o.value} value={o.value}>
            {o.label}
          </RadioGroupRow>
        ))}
      </RadioGroup>
    </ListDetailContent>
  )
}
