import { IDatepickerLocaleValues } from "../../localization/interfaces/values";
import { format, parse } from "date-fns";
import * as defaultLocale from "date-fns/locale/en-US";

interface IDateFnsLocaleValues { [name:string]:string[]; }
interface IDateFnsHelperOptions { type?:string; }
type DateFnsHelper<U, T> = (value:U, options:IDateFnsHelperOptions) => T;
type DateFnsWeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface IDateFnsCustomLocale {
    localize:{
        weekday:DateFnsHelper<number, string>;
        weekdays:DateFnsHelper<IDateFnsHelperOptions, string[]>;
        month:DateFnsHelper<number, string>;
        months:DateFnsHelper<IDateFnsHelperOptions, string[]>;
    };
    match:{
        weekdays:DateFnsHelper<string, RegExpMatchArray | null>;
        weekday?:DateFnsHelper<RegExpMatchArray, number>;
        months:DateFnsHelper<string, RegExpMatchArray | null>;
        month?:DateFnsHelper<RegExpMatchArray, number>;
    };
    options?:{
        weekStartsOn?:number;
    };
}

function buildLocalizeFn(values:IDateFnsLocaleValues, defaultType:string):DateFnsHelper<number, string> {
    return (dirtyIndex, { type } = { type: defaultType }) => values[type][dirtyIndex];
}

function buildLocalizeArrayFn(values:IDateFnsLocaleValues, defaultType:string):DateFnsHelper<IDateFnsHelperOptions, string[]> {
    return ({ type } = { type: defaultType }) => values[type];
}

function buildMatchFn(patterns:IDateFnsLocaleValues, defaultType:string):DateFnsHelper<string, RegExpMatchArray | null> {
    return (dirtyString, { type } = { type: defaultType }) =>
        dirtyString.match(`^(${patterns[type].join("|")})`);
}

function buildParseFn(patterns:IDateFnsLocaleValues, defaultType:string):DateFnsHelper<RegExpMatchArray, number> {
    return ([, result], { type } = { type: defaultType }) =>
        (patterns[type] || patterns[defaultType])
            .map(p => new RegExp(`^${p}`))
            .findIndex(pattern => pattern.test(result));
}

export class DateFnsParser {
    private _weekStartsOn:DateFnsWeekStartsOn;
    private _locale:IDateFnsCustomLocale;

    private get _config():any {
        return {
            weekStartsOn: this._weekStartsOn,
            locale: this._locale
        };
    }

    constructor(locale:IDatepickerLocaleValues) {
        this._weekStartsOn = locale.firstDayOfWeek as DateFnsWeekStartsOn;

        const weekdayValues = {
            long: locale.weekdays,
            short: locale.weekdaysShort,
            narrow: locale.weekdaysNarrow
        };

        const monthValues = {
            long: locale.months,
            short: locale.monthsShort
        };

        this._locale = defaultLocale as any;
        this._locale.localize = {
            ...this._locale.localize,
            ...{
                weekday: buildLocalizeFn(weekdayValues, "long"),
                weekdays: buildLocalizeArrayFn(weekdayValues, "long"),
                month: buildLocalizeFn(monthValues, "long"),
                months: buildLocalizeArrayFn(monthValues, "long")
            }
        };
        this._locale.match = {
            ...this._locale.match,
            ...{
                weekdays: buildMatchFn(weekdayValues, "long"),
                weekday: buildParseFn(weekdayValues, "long"),
                months: buildMatchFn(monthValues, "long"),
                month: buildParseFn(monthValues, "long")
            }
        };
    }

    public format(d:Date, f:string):string {
        return format(d, f, this._config);
    }

    public parse(dS:string, f:string, bD:Date):Date {
        return parse(dS, f, bD, this._config);
    }
}