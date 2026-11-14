import { activityTimeline } from "./activity-timeline";
import { combobox } from "./combobox";
import { commandPalette } from "./command-palette";
import { dataTable } from "./data-table";
import { dateRangePicker } from "./date-range-picker";
import { fileUploader } from "./file-uploader";
import { form } from "./form";
import { kanbanBoard } from "./kanban-board";
import { multiSelect } from "./multi-select";
import { notifications } from "./notifications";
import type { ComponentDoc } from "./types";

export const componentDocs: ComponentDoc[] = [
  dataTable,
  commandPalette,
  fileUploader,
  form,
  combobox,
  multiSelect,
  dateRangePicker,
  notifications,
  activityTimeline,
  kanbanBoard,
];

export type { ComponentDoc } from "./types";
