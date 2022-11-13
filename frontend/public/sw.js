self.addEventListener('push', (event) => {

    const data = event.data?.json() ?? {}
    const title = data.title || "Something Has Happened";
    const message = data.message || "Here's something you might want to check out.";
    self.registration.showNotification(title)
})