Cluster
├── Node 1
│   ├── Pod A
│   │   └── Container (nginx)
│   └── Pod B
│       └── Container (redis)
├── Node 2
│   └── Pod C
│       └── Container (postgres)
└── Node 3
    └── (Idle or other pods)

![alt text](image.png)

![alt text](image-1.png)


Deployment manages replica sets which manages a bunch of pods

