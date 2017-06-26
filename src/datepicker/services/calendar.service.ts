import { EventEmitter } from "@angular/core";
import { Util } from "../../util/util";
import { CalendarViewType, CalendarViewResult } from "../views/calendar-view";
import { CalendarMapping, CalendarMappings, DateMappings, TimeMappings, DatetimeMappings } from "../classes/calendar-mappings";
import { CalendarConfig } from "../classes/calendar-config";
import { DatePrecision } from "../../util/helpers/date";
import { ILocalizationValues } from "../../util/services/localization.service";
import { DateComparer } from "../classes/date-comparer";

export enum CalendarMode {
    DateOnly = 0,
    TimeOnly = 1,
    Both = 2
}

export class CalendarService {
    private _config:CalendarConfig;

    public get config():CalendarConfig {
        return this._config;
    }

    public set config(config:CalendarConfig) {
        this._config = config;
        config.updateBounds(this._selectedDate || this.currentDate);
    }

    public currentView:CalendarViewType;
    public get inFinalView():boolean {
        return this.currentView === this.config.mappings.finalView;
    }

    public currentDate:Date;
    private _selectedDate?:Date;

    public get selectedDate():Date | undefined {
        return this._selectedDate;
    }

    public set selectedDate(date:Date | undefined) {
        if (date) {
            this._selectedDate = Util.Date.clone(date);
            this.currentDate = Util.Date.clone(date);
        } else {
            this._selectedDate = undefined;
        }

        this.config.updateBounds(this._selectedDate || this.currentDate);
        this.onManualUpdate();
    }

    private _minDate?:Date;
    private _maxDate?:Date;

    public get minDate():Date | undefined {
        if (this._minDate && this.config.dateMinBound) {
            return this._minDate > this.config.dateMinBound ? this._minDate : this.config.dateMinBound;
        }
        return this._minDate || this.config.dateMinBound;
    }

    public set minDate(min:Date | undefined) {
        this._minDate = min;
    }

    public get maxDate():Date | undefined {
        if (this._maxDate && this.config.dateMaxBound) {
            return this._maxDate < this.config.dateMaxBound ? this._maxDate : this.config.dateMaxBound;
        }
        return this._maxDate || this.config.dateMaxBound;
    }

    public set maxDate(max:Date | undefined) {
        this._maxDate = max;
    }

    public firstDayOfWeek:number;

    public onDateChange:EventEmitter<Date>;

    constructor(config:CalendarConfig, public localizationValues:ILocalizationValues) {
        this.config = config;

        this.firstDayOfWeek = this.localizationValues.datepicker.firstDayOfWeek;

        this.onDateChange = new EventEmitter<Date>();

        this.reset();
    }

    public onManualUpdate:() => void = () => {};

    public reset():void {
        this.currentView = this.config.mappings.finalView;

        if (!this._selectedDate) {
            let today = new Date().getTime();
            if (this._minDate) {
                today = Math.max(today, this._minDate.getTime());
            }
            if (this._maxDate) {
                today = Math.min(today, this._maxDate.getTime());
            }

            this.currentDate = new Date(today);
            this.config.updateBounds(this.currentDate);

            this.currentView = this.config.mappings.initialView;
        }
    }

    public changeDate(date:Date, fromView:CalendarViewType):void {
        this.currentDate = date;

        if (fromView === this.config.mappings.finalView) {
            this.selectedDate = date;

            this.config.postProcess(date);

            return this.onDateChange.emit(date);
        }

        this.updateView(this.config.mappings.changed, fromView);
    }

    public zoomOut(fromView:CalendarViewType):void {
        this.updateView(this.config.mappings.zoom, fromView);
    }

    private updateView(mappings:Map<CalendarViewType, CalendarViewType>, fromView:CalendarViewType):void {
        const mapping = mappings.get(fromView);
        if (mapping == undefined) {
            throw new Error("Unknown view type.");
        }
        this.currentView = mapping;
    }
}
