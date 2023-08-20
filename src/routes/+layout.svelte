<script>
    import "../app.css";

    import { page } from '$app/stores';
</script>

<div class="mx-auto w-full max-w-7xl m-4">
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

    <slot />
</div>
