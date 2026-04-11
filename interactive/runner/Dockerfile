FROM alpine:3.19

# Install bash and all tools needed for the course exercises
RUN apk add --no-cache \
    bash \
    shellcheck \
    coreutils \
    grep \
    gawk \
    sed \
    findutils \
    curl \
    procps \
    util-linux \
    ncurses \
    bc

# Create non-root student user
RUN adduser -D -s /bin/bash -h /home/student student

# Pre-load course files and environment
COPY setup.sh /setup.sh
RUN chmod +x /setup.sh && bash /setup.sh && rm /setup.sh

# Set bash as default shell for student
USER student
WORKDIR /home/student
ENV TERM=xterm-256color
ENV PS1="student@reactor:~\$ "
ENV SHELL=/bin/bash

CMD ["/bin/bash", "--login"]
