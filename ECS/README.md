# ecs

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

containerize a nodejs app
creating an ecr repo and pushing the nodejs image to ecr

created IAM logged into aws cli 
build the image with the same name as the repo
now pushing the image to ECR


ECS :
    Cluster -> Service -> Task

create a cluster
create a task definiotion
create a service with tasks
add loadbalanceer and target groups to the service