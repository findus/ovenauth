self.addEventListener('push', (event) => {

    const data = event.data?.json() ?? {}
    const title = data.title || "Something Has Happened";
    const message = data.message || "Here's something you might want to check out.";

    let icon = "https://localhost/icon.svg"

    self.registration.showNotification(title, {
        body: message,
        icon: icon,
    })
})