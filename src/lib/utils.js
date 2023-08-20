import currency from "currency.js";

export const EURO = (value) => currency(
    value,
    {
        symbol: "€",
        decimal: ",",
        separator: " ",
        pattern: "# !",
        precision: 0
    }
);

export const EUROWithCents = (value) => currency(
    value,
    {
        symbol: "€",
        decimal: ",",
        separator: " ",
        pattern: "# !",
        precision: 2
    }
);
