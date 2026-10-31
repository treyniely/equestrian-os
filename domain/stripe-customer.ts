/** Allow only Stripe customer dashboard URLs; never accept arbitrary billing redirects. */
export function stripeCustomerUrl(value:string):string {
 const text=value.trim();if(!text)return '';
 let url:URL;try{url=new URL(text)}catch{throw Error('Paste a Stripe customer page URL.')}
 if(url.protocol!=='https:'||url.hostname!=='dashboard.stripe.com'||url.port||url.username||url.password||url.search||url.hash||!/^\/(?:acct_[A-Za-z0-9]+\/)?(?:test\/)?customers\/cus_[A-Za-z0-9]+\/?$/.test(url.pathname))throw Error('Use a customer page from dashboard.stripe.com.');
 return 'https://dashboard.stripe.com'+url.pathname.replace(/\/$/,'');
}
