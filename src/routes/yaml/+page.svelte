<script>
    import yaml from 'js-yaml';
    import { data } from "$lib/store.js";
    import { format, parseISO } from 'date-fns';

    let exportData = {
        date_dernier_jour_emploi: format($data.dateDernierJourEmploi, 'yyyy-MM-d'),
        dernier_salaire_net_par_mois_en_euros: $data.dernierSalaireNetParMoisEnEuros.value,
        indemnite_depart_net: $data.indemniteDepartNet.value,
        votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois: $data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois
    };

    if ($data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois == "oui") {
        exportData.salaires_brut_par_mois_en_euros = $data.salairesBrutParMoisEnEuros;
    } else {
        exportData.salaire_brut_par_mois_en_euros = $data.salaireBrutParMoisEnEuros.value;
    }

    let yamlData = yaml.dump(exportData);

    $: {
        try {
            let tmp = yaml.load(yamlData);
            if (tmp?.date_dernier_jour_emploi) {
                $data.dateDernierJourEmploi = parseISO(tmp.date_dernier_jour_emploi);
            }
            if (tmp?.dernier_salaire_net_par_mois_en_euros) {
                $data.dernierSalaireNetParMoisEnEurosInput = tmp.dernier_salaire_net_par_mois_en_euros;
            }
            if (tmp?.indemnite_depart_net) {
                $data.indemniteDepartNetInput = tmp.indemnite_depart_net;
            }
            if (tmp?.votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois) {
                $data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois = tmp.votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois;

                if (tmp.votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois == "oui") {
                    $data.salairesBrutParMoisEnEuros = tmp.salaires_brut_par_mois_en_euros;
                } else {
                    $data.salaireBrutParMoisEnEurosInput = exportData.salaire_brut_par_mois_en_euros;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

</script>

Yaml :

<textarea
    class="w-full h-96 rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
    bind:value={yamlData} />
