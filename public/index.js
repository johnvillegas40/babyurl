const app=new Vue({el:"#app",data:{url:"",slug:"",error:"",formVisible:!0,created:null},methods:{async createUrl(){console.log(this.url,this.slug);const a=await fetch("/url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:this.url,slug:this.slug||void 0})});if(a.ok){const b=await a.json(),c=JSON.parse(b);this.formVisible=!1,this.created=`babyurl.dev/${c.slug}`}else{const b=await a.json();this.error=b.message}}}});