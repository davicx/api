

async function scanEC2(region) {

    const response = await axios.post(
        "http://127.0.0.1:8000/scan/ec2",
        {
            scan_type: "full",
            team: "cloud-pilot",
            region: region,
            rules: []
        }
    );

    return response.data;
}