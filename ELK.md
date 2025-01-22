If you want to set up an ELK (Elasticsearch, Logstash, Kibana) stack to capture logs from a Ktor application **without using Filebeat**, you can achieve this by directly sending logs from your Ktor app to Logstash using JSON over TCP or HTTP. Below is a step-by-step guide to accomplish this.

---

## **1. Docker Compose Setup for ELK (without Filebeat)**

Create a `docker-compose.yml` file to set up Elasticsearch, Logstash, and Kibana:

```yaml
version: '3.7'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    networks:
      - elk-net

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    ports:
      - "5044:5044"  # TCP input for logs from Ktor app
      - "9600:9600"  # Monitoring
    networks:
      - elk-net
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    depends_on:
      - elasticsearch
    ports:
      - "5601:5601"
    networks:
      - elk-net

networks:
  elk-net:
    driver: bridge
```

---

## **2. Logstash Configuration (`logstash.conf`)**

Create a `logstash.conf` file to process logs received from your Ktor application:

```plaintext
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  mutate {
    add_field => { "service" => "ktor-app" }
  }
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "ktor-logs-%{+YYYY.MM.dd}"
  }

  stdout { codec => rubydebug }
}
```

---

## **3. Ktor Application Logging Setup**

In your Ktor application, configure logging to send logs directly to Logstash using `logback` or another logging framework.

### **Add Dependencies in `build.gradle.kts`:**
```kotlin
dependencies {
    implementation("ch.qos.logback:logback-classic:1.4.11")
    implementation("net.logstash.logback:logstash-logback-encoder:7.3")
}
```

---

### **Configure Logging in `resources/logback.xml`:**

```xml
<configuration>
    <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>localhost:5044</destination>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"app_name":"ktor-app","environment":"development"}</customFields>
        </encoder>
    </appender>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%-4relative [%thread] %-5level %logger{35} - %msg %n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="LOGSTASH"/>
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

---

## **4. Running the Setup**

1. Start the ELK stack:
   ```sh
   docker-compose up -d
   ```
2. Start your Ktor application.

---

## **5. Verifying the Logs**

- **Elasticsearch:**  
  Check if logs are stored in Elasticsearch by running:
  ```sh
  curl -X GET "http://localhost:9200/_cat/indices?v"
  ```

- **Kibana:**  
  Visit `http://localhost:5601`, go to **Discover**, and create an index pattern `ktor-logs-*` to view logs.

- **Logstash:**  
  You can check logs from Logstash in the console by viewing container logs:
  ```sh
  docker logs -f logstash
  ```

---

## **6. Explanation of the Flow**

1. **Ktor App:**  
   - Logs are formatted as JSON and sent over TCP to Logstash.
   
2. **Logstash:**  
   - Receives logs, adds custom fields, and forwards them to Elasticsearch.

3. **Elasticsearch:**  
   - Stores the logs and makes them searchable.

4. **Kibana:**  
   - Visualizes and analyzes logs.

---

This approach allows for centralized logging without using Filebeat by directly integrating Ktor logging with Logstash, simplifying the architecture while keeping log management efficient.

Let me know if you need any adjustments!
