<script lang="ts">
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Hi, {data.user.username}!</h1>
<img src={data.user.profileImage} alt="profile" />
<p>User ID:{data.user.id}</p>
<p>Email:{data.user.email}</p>

<form method="post" action="/logout">
	<button>Sign out</button>
</form>
