import { writable } from "svelte/store";
import { EURO } from "$lib/utils.js";
import { parseISO } from "date-fns";

export const data = writable({
    name: "John Doe",
    dateDernierJourEmploi: parseISO("2023-08-30"),
    dernierSalaireNetParMoisEnEuros: EURO(2000),
    dernierSalaireNetParMoisEnEurosInput: 2000,
    indemniteDepartNet: EURO(10000),
    indemniteDepartNetInput: 10000,
    votreSalaireBrutATIlVariéAuCoursDes24DerniersMois: "non",
    salaireBrutParMoisEnEuros: EURO(2000),
    salaireBrutParMoisEnEurosInput: 2000,
    salairesBrutParMoisEnEuros: new Array(24)
});
