const app = new Vue({
    el: '#app',
    data: {
        url: '',
        slug: '',
        error: '',
        formVisible: true,
        created: null,
    },
    methods: {
        async createUrl() {
            console.log(this.url, this.slug)

            const response = await fetch('/url', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    url: this.url,
                    slug: this.slug || undefined,
                })
            });
            if (response.ok) {
                const result = await response.json();
                const res = JSON.parse(result)
                this.formVisible = false;
                this.created = `babyurl.dev/${res.slug}`;
            } else {
                const result = await response.json();
                this.error = result.message;
            }

            
        }
    }
})