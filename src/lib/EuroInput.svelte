<script>
    export let id;
    export let name;
    export let value;
</script>

<div class="relative mt-2 rounded-md shadow-sm w-24">
    <input
        type="text"
        id={id}
        name={name}
        bind:value={value}
        class="block w-full rounded-md border-0 py-1.5 pl-3 pr-7 text-gray-900 ring-1 ring-inset
        ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600
        sm:text-sm sm:leading-6 text-right" />
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <span class="text-gray-500 sm:text-sm" id="price-currency">€</span>
    </div>
</div>
