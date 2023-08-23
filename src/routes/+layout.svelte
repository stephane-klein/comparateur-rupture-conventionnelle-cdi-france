<script>
    import "../app.css";

    import { page } from '$app/stores';
    import { data } from "$lib/store.js";
    import { format, parseISO } from 'date-fns';

    if ($page.url.searchParams.has("date_dernier_jour_emploi")) {
        $data.dateDernierJourEmploi = parseISO($page.url.searchParams.get("date_dernier_jour_emploi"));
    }
    if ($page.url.searchParams.has("dernier_salaire_net_par_mois_en_euros")) {
        $data.dernierSalaireNetParMoisEnEurosInput = $page.url.searchParams.get("dernier_salaire_net_par_mois_en_euros");
    }
    if ($page.url.searchParams.has("indemnite_depart_net")) {
        $data.indemniteDepartNetInput = $page.url.searchParams.get("indemnite_depart_net");
    }
    if ($page.url.searchParams.has("votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois")) {
        $data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois = $page.url.searchParams.get("votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois");

        if ($page.url.searchParams.get("votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois") == "oui") {
            $data.salairesBrutParMoisEnEuros = $page.url.searchParams.get("salaires_brut_par_mois_en_euros").split(",");
        } else {
            $data.salaireBrutParMoisEnEurosInput = $page.url.searchParams.get("salaire_brut_par_mois_en_euros");
        }
    }

    if ($page.url.searchParams.has("taux_impot_sur_le_revenu_en_pourcent")) {
        $data.tauxImpôtSurLeRevenuEnPourcentInput = $page.url.searchParams.get("taux_impot_sur_le_revenu_en_pourcent");
    }

    let shareUrl;
    $: {
        let params = [
            ["date_dernier_jour_emploi", format($data.dateDernierJourEmploi, 'yyyy-MM-d')],
            ["dernier_salaire_net_par_mois_en_euros", $data.dernierSalaireNetParMoisEnEuros.value],
            ["indemnite_depart_net", $data.indemniteDepartNet.value],
            ["votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois", $data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois],
            ["taux_impot_sur_le_revenu_en_pourcent", $data.tauxImpôtSurLeRevenuEnPourcentInput]
        ];
        if ($data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois == "oui") {
            params.push([
                "salaires_brut_par_mois_en_euros",
                $data.salairesBrutParMoisEnEuros
            ])
        } else {
            params.push([
                "salaire_brut_par_mois_en_euros",
                $data.salaireBrutParMoisEnEuros.value
            ])
        }

        shareUrl = (new URLSearchParams(params)).toString();
    }
</script>

<div class="mx-auto w-full max-w-7xl m-4">
    <p class="text-right text-xs"><a
        href="https://github.com/stephane-klein/comparateur-rupture-conventionnelle-cdi-france/commits/main">Date de
        dernière publication : 2023-08-23</a></p>
    <div class="flex flex-row">
        <div class="grow flex flex-row space-x-4 font-semibold text-gray-600 my-4">
            <a
                class="hover:text-gray-900 border-red-400 px-2 py-1 border-b-4"
                class:border-b-4={$page.url.pathname == '/'}
                href="/">Simulateur</a>
            <a
                class="hover:text-gray-900 border-red-400 px-2 py-1"
                class:border-b-4={$page.url.pathname == '/yaml/'}
                href="/yaml/"
            >YAML</a>
            <a
                class="hover:text-gray-900 border-red-400 px-2 py-1"
                class:border-b-4={$page.url.pathname == '/%C3%A0-propos/'}
                href="/à-propos/"
            >À propos</a>
        </div>
        <a
            class="hover:text-gray-900 my-4 py-1"
            href={`?${shareUrl}`}>Partager la page avec les paramètres dans l'url</a>
    </div>
    <slot />
</div>
